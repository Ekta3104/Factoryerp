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
    const sqlPath = path.resolve(__dirname, '../../database/08_add_production_formulas.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration 08: add production formulas (BOM)...');
    await pool.query(sql);
    console.log('✅ Migration 08 completed successfully.');

    // Verify
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_name IN ('product_formulas', 'formula_ingredients', 'production_batch_materials')
      ORDER BY table_name
    `);
    console.log('   Tables created:', tables.rows.map(r => r.table_name).join(', '));

    const col = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'production_batches' AND column_name IN ('formula_id', 'quantity_used')
      ORDER BY column_name
    `);
    col.rows.forEach(c => console.log(`   Column: ${c.column_name}  |  Type: ${c.data_type}  |  Nullable: ${c.is_nullable}`));
  } catch (err) {
    console.error('❌ Migration 08 failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
