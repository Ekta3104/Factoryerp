import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'factoryerp',
});

async function runMigration() {
  try {
    const sqlPath = path.resolve(__dirname, '../../database/06_reports_indexes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Creating report performance indexes...');
    await pool.query(sql);
    console.log('Indexes created successfully.');
  } catch (err) {
    console.error('Error executing migration:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
