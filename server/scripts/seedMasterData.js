import { pool } from '../config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function seedMasterData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Seeding Master Data...');

    // 1. Units
    const unit1Res = await client.query(`
      INSERT INTO units (name, abbreviation) 
      VALUES ('Kilograms', 'kg') 
      ON CONFLICT (name) DO NOTHING RETURNING id;
    `);
    const unit2Res = await client.query(`
      INSERT INTO units (name, abbreviation) 
      VALUES ('Liters', 'L') 
      ON CONFLICT (name) DO NOTHING RETURNING id;
    `);

    // Fetch unit IDs just in case they already existed
    const kgUnit = await client.query("SELECT id FROM units WHERE abbreviation = 'kg'");
    const lUnit = await client.query("SELECT id FROM units WHERE abbreviation = 'L'");
    const kgId = kgUnit.rows[0].id;
    
    // 2. Suppliers
    await client.query(`
      INSERT INTO suppliers (name, contact_person, phone) 
      VALUES 
      ('Alpha Raw Materials Pvt Ltd', 'John Doe', '9876543210'),
      ('Beta Chemicals', 'Jane Smith', '9876543211')
    `);

    // 3. Customers
    await client.query(`
      INSERT INTO customers (name, contact_person, phone) 
      VALUES 
      ('Acme Corp', 'Alice Brown', '9876543212'),
      ('Global Industries', 'Bob White', '9876543213')
    `);

    // 4. Raw Materials
    await client.query(`
      INSERT INTO raw_materials (name, unit_id, reorder_level, current_stock) 
      VALUES 
      ('Raw Material A (Iron)', $1, 500, 1000),
      ('Raw Material B (Plastic)', $1, 200, 150)
    `, [kgId]);

    // 5. Ready Materials
    await client.query(`
      INSERT INTO ready_materials (name, unit_id, selling_price, current_stock) 
      VALUES 
      ('Finished Product X', $1, 150.00, 0),
      ('Finished Product Y', $1, 250.00, 0)
    `, [kgId]);

    await client.query('COMMIT');
    console.log('Master data seeded successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding master data:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

seedMasterData();
