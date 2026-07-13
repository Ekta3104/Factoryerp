import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbName = process.env.DB_NAME || 'factoryerp';
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: dbName,
};

async function runMigration() {
  const pool = new Pool(dbConfig);
  try {
    const sqlPath = path.resolve(__dirname, '../../database/04_update_dispatches.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing update dispatches migration script...');
    await pool.query(sql);
    console.log('Migration executed successfully.');
  } catch (err) {
    console.error('Error executing migration:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
