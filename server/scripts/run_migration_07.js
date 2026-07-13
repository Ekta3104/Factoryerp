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
    const sqlPath = path.resolve(__dirname, '../../database/07_add_users_is_active.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration 07: add is_active to users...');
    await pool.query(sql);
    console.log('✅ Migration 07 completed successfully.');

    // Verify
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'is_active'
    `);
    if (result.rowCount > 0) {
      const col = result.rows[0];
      console.log(`   Column: ${col.column_name}  |  Type: ${col.data_type}  |  Default: ${col.column_default}`);
    }
  } catch (err) {
    console.error('❌ Migration 07 failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
