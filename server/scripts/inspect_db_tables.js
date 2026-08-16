import pkg from 'pg';
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

async function inspect() {
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log('Existing tables:', tables.rows.map(r => r.table_name));

  for (const row of tables.rows) {
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1;
    `, [row.table_name]);
    console.log(`\nTable [${row.table_name}]:`);
    cols.rows.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));
  }

  await pool.end();
}

inspect();
