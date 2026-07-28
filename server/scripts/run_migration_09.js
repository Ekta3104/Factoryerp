import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME     || 'factoryerp',
};

async function runMigration() {
  const pool = new Pool(dbConfig);
  try {
    const sqlPath = path.resolve(__dirname, '../../database/09_add_ready_material_pack_size.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration 09: add ready_materials.pack_size_kg + Bags unit...');
    await pool.query(sql);
    console.log('✅ Migration 09 completed successfully.');

    const col = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'ready_materials' AND column_name = 'pack_size_kg'
    `);
    col.rows.forEach(c => console.log(`   Column: ${c.column_name}  |  Type: ${c.data_type}`));

    const unit = await pool.query(`SELECT name, abbreviation FROM units WHERE name = 'Bags'`);
    console.log('   Unit:', unit.rows[0]);
  } catch (err) {
    console.error('❌ Migration 09 failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
