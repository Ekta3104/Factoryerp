/**
 * import_data.js
 *
 * Loads a JSON backup (produced by export_data.js) into a target Postgres
 * database — e.g. a fresh Neon database that already has the schema
 * created (via `npm run db:setup` or the migration files in /database).
 *
 * Any pre-existing rows in the target tables (e.g. the seeded admin user)
 * are cleared first, then the real backed-up rows are inserted with their
 * original UUIDs intact, so relationships between tables stay correct.
 *
 * Usage (from the server/ directory):
 *   DATABASE_URL="postgresql://...neon..." BACKUP_DIR="backup/2026-08-17T07-03-18-453Z" node scripts/import_data.js
 */

import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL;
const backupDirArg = process.env.BACKUP_DIR;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set.');
  console.error('   Usage: DATABASE_URL="postgresql://..." BACKUP_DIR="backup/<timestamp>" node scripts/import_data.js');
  process.exit(1);
}

if (!backupDirArg) {
  console.error('❌ BACKUP_DIR is not set (e.g. backup/2026-08-17T07-03-18-453Z).');
  process.exit(1);
}

const backupDir = path.resolve(__dirname, '..', backupDirArg);

if (!fs.existsSync(backupDir)) {
  console.error(`❌ Backup directory not found: ${backupDir}`);
  process.exit(1);
}

// Parent tables first (insert order). Deletion happens in reverse.
const TABLE_ORDER = [
  'units',
  'suppliers',
  'customers',
  'users',
  'raw_materials',
  'ready_materials',
  'product_formulas',
  'formula_ingredients',
  'vehicle_inwards',
  'production_batches',
  'production_batch_materials',
  'dispatches',
  'expenses',
  'labour',
  'machine_maintenance',
  'activity_logs',
];

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

function prepareValue(v) {
  if (v !== null && typeof v === 'object') {
    return JSON.stringify(v);
  }
  return v;
}

async function importTable(client, table) {
  const filePath = path.join(backupDir, `${table}.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  ${table}: no backup file, skipping`);
    return;
  }

  const rows = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (rows.length === 0) {
    console.log(`⏭️  ${table}: 0 rows, nothing to import`);
    return;
  }

  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(', ');

  let inserted = 0;
  for (const row of rows) {
    const values = columns.map((c) => prepareValue(row[c]));
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    await client.query(
      `INSERT INTO "${table}" (${colList}) VALUES (${placeholders})`,
      values
    );
    inserted++;
  }

  console.log(`✅ ${table}: inserted ${inserted} rows`);
}

async function main() {
  const client = await pool.connect();
  try {
    console.log(`🚀 Importing backup from: ${backupDir}\n`);

    await client.query('BEGIN');

    console.log('🧹 Clearing existing rows from target tables...');
    for (const table of [...TABLE_ORDER].reverse()) {
      await client.query(`DELETE FROM "${table}"`);
    }
    console.log('✅ Cleared.\n');

    console.log('📥 Inserting backed-up data...');
    for (const table of TABLE_ORDER) {
      await importTable(client, table);
    }

    await client.query('COMMIT');
    console.log('\n✅ Import complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Import failed, rolled back:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
