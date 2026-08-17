/**
 * export_data.js
 *
 * Downloads a full data backup (every table in the `public` schema) from
 * a Postgres database into local JSON files — one file per table, plus
 * a manifest. Used to pull data OFF the old Render Postgres instance
 * before it gets suspended.
 *
 * Usage (from the server/ directory):
 *   DATABASE_URL="postgresql://user:pass@host:port/dbname" node scripts/export_data.js
 *
 * The DATABASE_URL is Render's "External Database URL" for factoryerp-db
 * (Render dashboard → factoryerp-db → Connect → External Database URL).
 *
 * Output goes to server/backup/<timestamp>/<table_name>.json
 */

import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set.');
  console.error('   Usage: DATABASE_URL="postgresql://..." node scripts/export_data.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.resolve(__dirname, '../backup', timestamp);
  fs.mkdirSync(outDir, { recursive: true });

  console.log('🚀 Connecting to source database...');

  const tablesRes = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  const tables = tablesRes.rows.map((r) => r.table_name);
  console.log(`📋 Found ${tables.length} tables: ${tables.join(', ')}\n`);

  const manifest = { exported_at: new Date().toISOString(), tables: {} };

  for (const table of tables) {
    const res = await pool.query(`SELECT * FROM "${table}"`);
    const filePath = path.join(outDir, `${table}.json`);
    fs.writeFileSync(filePath, JSON.stringify(res.rows, null, 2));
    manifest.tables[table] = res.rowCount;
    console.log(`✅ ${table}: ${res.rowCount} rows → ${path.relative(process.cwd(), filePath)}`);
  }

  fs.writeFileSync(path.join(outDir, '_manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\n✅ Backup complete: ${outDir}`);
  await pool.end();
}

main().catch((err) => {
  console.error('\n❌ Export failed:', err.message);
  process.exit(1);
});
