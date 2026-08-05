import { pool } from '../config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function fixPackSizesAndUnits() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 0. Ensure migration 09 column exists
    await client.query(`
      ALTER TABLE ready_materials
      ADD COLUMN IF NOT EXISTS pack_size_kg NUMERIC(10, 2);
    `);
    console.log('Ensured column pack_size_kg exists on ready_materials table.');

    // 1. Ensure 'Bags' unit exists
    let bagsUnitRes = await client.query(`SELECT id FROM units WHERE name = 'Bags' OR abbreviation = 'bag'`);
    let bagsUnitId;
    if (bagsUnitRes.rowCount === 0) {
      const insRes = await client.query(`INSERT INTO units (name, abbreviation) VALUES ('Bags', 'bag') RETURNING id`);
      bagsUnitId = insRes.rows[0].id;
      console.log('Inserted Bags unit:', bagsUnitId);
    } else {
      bagsUnitId = bagsUnitRes.rows[0].id;
      console.log('Found Bags unit:', bagsUnitId);
    }

    // 2. Update 'Gypsum Powder (25Kg Pack)' -> 25 kg & Bags unit
    const res1 = await client.query(
      `UPDATE ready_materials SET pack_size_kg = 25.00, unit_id = $1 WHERE name ILIKE '%Gypsum Powder%' RETURNING id, name, pack_size_kg`,
      [bagsUnitId]
    );
    console.log('Updated Gypsum Powder ready materials:', res1.rows);

    // 3. Update 'Gold Suryadarshan (10Kg Pack)' -> 10 kg & Bags unit
    const res2 = await client.query(
      `UPDATE ready_materials SET pack_size_kg = 10.00, unit_id = $1 WHERE name ILIKE '%Gold Suryadarshan%' RETURNING id, name, pack_size_kg`,
      [bagsUnitId]
    );
    console.log('Updated Gold Suryadarshan ready materials:', res2.rows);

    // 4. Update any other ready materials with null pack_size_kg to default 25kg & Bags unit
    const res3 = await client.query(
      `UPDATE ready_materials SET pack_size_kg = 25.00, unit_id = $1 WHERE pack_size_kg IS NULL RETURNING id, name, pack_size_kg`,
      [bagsUnitId]
    );
    console.log('Updated remaining ready materials:', res3.rows);

    await client.query('COMMIT');
    console.log('✅ Pack sizes and units fixed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fixing pack sizes and units:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

fixPackSizesAndUnits();
