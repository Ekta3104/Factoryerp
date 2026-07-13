import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool, Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbName = process.env.DB_NAME || 'factoryerp';
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

async function runMigration() {
  // 1. Ensure the database exists
  const client = new Client({ ...dbConfig, database: 'postgres' });
  try {
    await client.connect();
    const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = $1`, [dbName]);
    if (res.rowCount === 0) {
      console.log(`Database '${dbName}' does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database '${dbName}' created successfully.`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }
  } catch (err) {
    console.error('Error ensuring database exists:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }

  // 2. Connect to the target database and execute the SQL file
  const pool = new Pool({ ...dbConfig, database: dbName });
  try {
    const sqlPath = path.resolve(__dirname, '../../database/01_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing migration script...');
    await pool.query(sql);
    console.log('Migration executed successfully.');
    
    // Verify tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n--- VERIFICATION: Created Tables ---');
    result.rows.forEach(row => console.log(`- ${row.table_name}`));
    console.log('------------------------------------\n');
  } catch (err) {
    console.error('Error executing migration:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
