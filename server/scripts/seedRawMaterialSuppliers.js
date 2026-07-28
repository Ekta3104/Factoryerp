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

    // Remove placeholder demo data
    await client.query(`DELETE FROM raw_materials WHERE name IN ('Raw Material A (Iron)', 'Raw Material B (Plastic)')`);
    await client.query(`DELETE FROM suppliers WHERE name IN ('Alpha Raw Materials Pvt Ltd', 'Beta Chemicals')`);
    console.log('Removed placeholder demo suppliers/raw materials.');

    // Unit: Tons
    await client.query(`
      INSERT INTO units (name, abbreviation)
      VALUES ('Tons', 't')
      ON CONFLICT (name) DO NOTHING
    `);
    const tonUnit = await client.query(`SELECT id FROM units WHERE abbreviation = 't'`);
    const tonId = tonUnit.rows[0].id;

    // Suppliers
    const suppliers = ['Gujarat Fluorochemicals Limited', 'Navin Fluorine', 'Gulista Lime'];
    for (const name of suppliers) {
      await client.query(
        `INSERT INTO suppliers (name) SELECT $1::varchar WHERE NOT EXISTS (SELECT 1 FROM suppliers WHERE name = $1::varchar)`,
        [name]
      );
    }
    console.log('Suppliers added:', suppliers);

    // Raw materials
    const rawMaterials = ['Gypsum Powder', 'Lime Powder', 'Soil'];
    for (const name of rawMaterials) {
      await client.query(
        `INSERT INTO raw_materials (name, unit_id) SELECT $1::varchar, $2::uuid WHERE NOT EXISTS (SELECT 1 FROM raw_materials WHERE name = $1::varchar)`,
        [name, tonId]
      );
    }
    console.log('Raw materials added:', rawMaterials);

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
