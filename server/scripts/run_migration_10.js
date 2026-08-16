import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'factoryerp',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  const sqlPath = path.resolve(__dirname, '../../database/10_salary_and_universal_advance.sql');
  console.log(`Running migration 10 statement by statement from: ${sqlPath}`);

  const sql = fs.readFileSync(sqlPath, 'utf8');
  // Strip comments and split by semicolon
  const statements = sql
    .replace(/--.*$/gm, '')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && s !== 'BEGIN' && s !== 'COMMIT');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await client.query(stmt);
        console.log(`[${i + 1}/${statements.length}] Success: ${stmt.substring(0, 50).replace(/\s+/g, ' ')}...`);
      } catch (err) {
        console.error(`[${i + 1}/${statements.length}] Failed: ${stmt}`);
        console.error(`Error details: ${err.message}`);
        throw err;
      }
    }
    await client.query('COMMIT');
    console.log('✅ Migration 10 completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration transaction rolled back.');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
