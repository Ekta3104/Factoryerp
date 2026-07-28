import { pool } from '../config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Remove placeholder demo ready materials
    await client.query(`DELETE FROM ready_materials WHERE name IN ('Finished Product X', 'Finished Product Y')`);
    console.log('Removed placeholder demo ready materials.');

    const tonUnit = await client.query(`SELECT id FROM units WHERE abbreviation = 't'`);
    const tonId = tonUnit.rows[0].id;

    // Ready materials
    const readyMaterials = ['Gypsum Powder (25Kg Pack)', 'Gold Suryadarshan (10Kg Pack)'];
    for (const name of readyMaterials) {
      await client.query(
        `INSERT INTO ready_materials (name, unit_id) SELECT $1::varchar, $2::uuid WHERE NOT EXISTS (SELECT 1 FROM ready_materials WHERE name = $1::varchar)`,
        [name, tonId]
      );
    }
    console.log('Ready materials added:', readyMaterials);

    // Raw material lookups
    const rawIds = {};
    for (const name of ['Gypsum Powder', 'Soil', 'Lime Powder']) {
      const res = await client.query(`SELECT id FROM raw_materials WHERE name = $1`, [name]);
      if (res.rowCount === 0) throw new Error(`Raw material not found: ${name}`);
      rawIds[name] = res.rows[0].id;
    }

    // Formulas: { name, readyMaterialName, outputQuantity, ingredients: { rawMaterialName: quantity } }
    const formulas = [
      {
        name: 'Standard Gypsum Powder',
        readyMaterialName: 'Gypsum Powder (25Kg Pack)',
        outputQuantity: 10,
        ingredients: { 'Gypsum Powder': 5, 'Soil': 4.5, 'Lime Powder': 0.5 }
      },
      {
        name: 'Gold Suryadarshan',
        readyMaterialName: 'Gold Suryadarshan (10Kg Pack)',
        outputQuantity: 10,
        ingredients: { 'Gypsum Powder': 7, 'Soil': 2.5, 'Lime Powder': 0.5 }
      }
    ];

    for (const formula of formulas) {
      const readyRes = await client.query(`SELECT id FROM ready_materials WHERE name = $1`, [formula.readyMaterialName]);
      const readyMaterialId = readyRes.rows[0].id;

      const existing = await client.query(`SELECT id FROM product_formulas WHERE name = $1`, [formula.name]);
      let formulaId;
      if (existing.rowCount > 0) {
        formulaId = existing.rows[0].id;
        console.log(`Formula already exists, skipping: ${formula.name}`);
        continue;
      }

      const inserted = await client.query(
        `INSERT INTO product_formulas (name, ready_material_id, output_quantity) VALUES ($1, $2, $3) RETURNING id`,
        [formula.name, readyMaterialId, formula.outputQuantity]
      );
      formulaId = inserted.rows[0].id;

      for (const [rawName, quantity] of Object.entries(formula.ingredients)) {
        await client.query(
          `INSERT INTO formula_ingredients (formula_id, raw_material_id, quantity) VALUES ($1, $2, $3)`,
          [formulaId, rawIds[rawName], quantity]
        );
      }
      console.log(`Formula added: ${formula.name} ->`, formula.ingredients);
    }

    await client.query('COMMIT');
    console.log('Done.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
