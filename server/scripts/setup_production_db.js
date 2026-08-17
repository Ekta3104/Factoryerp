/**
 * setup_production_db.js
 *
 * One-shot script to set up a fresh database (local or Render/production).
 * Runs ALL migrations in order, then seeds the admin user.
 *
 * Usage (from the server/ directory):
 *   node scripts/setup_production_db.js
 *
 * For Render (external DB): temporarily set DB_HOST, DB_USER, DB_PASSWORD,
 * DB_NAME, DB_PORT, and NODE_ENV=production in server/.env, then run.
 *
 * SSL: enabled automatically when NODE_ENV=production.
 */

import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

const { Pool, Client } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const isProduction = process.env.NODE_ENV === 'production';

// Prefer a single DATABASE_URL (e.g. Neon's connection string) when set;
// fall back to the individual DB_* vars for local/dev use.
const dbConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME     || 'factoryerp',
      ssl:      isProduction ? { rejectUnauthorized: false } : false,
    };

// Ordered list of SQL migration files (relative to /database)
const MIGRATIONS = [
  '01_initial_schema.sql',
  '02_update_vehicle_inwards.sql',
  '03_update_production_batches.sql',
  '04_update_dispatches.sql',
  '05_update_expenses.sql',
  '06_reports_indexes.sql',
  '07_add_users_is_active.sql',
  '08_add_production_formulas.sql',
  '09_add_ready_material_pack_size.sql',
  '10_salary_and_universal_advance.sql',
];

const DB_DIR = path.resolve(__dirname, '../../database');

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

async function ensureDatabase() {
  // Skip DB creation for Render — the DB is pre-created by the platform
  if (isProduction) {
    console.log('ℹ️  Production mode: skipping CREATE DATABASE step (DB pre-created by host).');
    return;
  }

  const { database, ...adminConfig } = dbConfig;
  const client = new Client({ ...adminConfig, database: 'postgres' });
  try {
    await client.connect();
    const res = await client.query(
      `SELECT datname FROM pg_catalog.pg_database WHERE datname = $1`,
      [database]
    );
    if (res.rowCount === 0) {
      console.log(`📦 Creating database "${database}"...`);
      await client.query(`CREATE DATABASE "${database}"`);
      console.log(`✅ Database "${database}" created.`);
    } else {
      console.log(`ℹ️  Database "${database}" already exists.`);
    }
  } finally {
    await client.end();
  }
}

async function resetSchema(pool) {
  console.log('\n⚠️  Resetting schema — dropping all existing tables...');
  // DROP + recreate public schema is the cleanest way to wipe partial tables
  await pool.query('DROP SCHEMA public CASCADE');
  await pool.query('CREATE SCHEMA public');
  await pool.query('GRANT ALL ON SCHEMA public TO PUBLIC');
  console.log('✅ Schema reset complete — fresh start.\n');
}

async function runMigrations(pool) {
  console.log('\n─────────────────────────────────────');
  console.log('Running migrations…');
  console.log('─────────────────────────────────────');

  for (const file of MIGRATIONS) {
    const sqlPath = path.join(DB_DIR, file);
    if (!fs.existsSync(sqlPath)) {
      console.warn(`⚠️  Migration file not found, skipping: ${file}`);
      continue;
    }
    const sql = fs.readFileSync(sqlPath, 'utf8');
    try {
      await pool.query(sql);
      console.log(`✅ ${file}`);
    } catch (err) {
      console.error(`❌ ${file} FAILED: ${err.message}`);
      throw err; // abort — don't continue on a broken schema
    }
  }
  console.log('─────────────────────────────────────');
  console.log('All migrations complete.\n');
}

async function seedAdmin(pool) {
  const username = process.env.SEED_USERNAME || 'admin';
  const email    = process.env.SEED_EMAIL    || 'admin@factoryerp.com';
  const role     = process.env.SEED_ROLE     || 'Admin';
  const password = process.env.SEED_PASSWORD;

  if (!password) {
    console.error('❌ SEED_PASSWORD is not set in .env — skipping admin seed.');
    console.error('   Set SEED_PASSWORD then re-run, or create the user manually.');
    return;
  }

  const validRoles = ['Owner', 'Admin'];
  if (!validRoles.includes(role)) {
    console.error(`❌ SEED_ROLE "${role}" is invalid. Must be one of: ${validRoles.join(', ')}`);
    return;
  }

  console.log('─────────────────────────────────────');
  console.log('Seeding admin user…');
  console.log('─────────────────────────────────────');

  const existing = await pool.query(
    'SELECT id, username FROM users WHERE username = $1 OR email = $2',
    [username, email]
  );

  if (existing.rowCount > 0) {
    console.log(`ℹ️  User "${existing.rows[0].username}" already exists — skipping seed.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, username, email, role`,
    [username, email, passwordHash, role]
  );

  const u = result.rows[0];
  console.log('✅ Admin user created:');
  console.log(`   Username : ${u.username}`);
  console.log(`   Email    : ${u.email}`);
  console.log(`   Role     : ${u.role}`);
  console.log(`   ID       : ${u.id}`);
  console.log('\n⚠️  Change the password immediately after first login.');
  console.log('─────────────────────────────────────\n');
}

// ──────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 FactoryERP — Production DB Setup');
  console.log(`   Host     : ${dbConfig.host}:${dbConfig.port}`);
  console.log(`   Database : ${dbConfig.database}`);
  console.log(`   SSL      : ${isProduction ? 'enabled' : 'disabled'}`);
  console.log(`   Mode     : ${isProduction ? 'production' : 'development'}\n`);

  try {
    await ensureDatabase();

    const pool = new Pool(dbConfig);

    await resetSchema(pool);
    await runMigrations(pool);
    await seedAdmin(pool);

    // Final verification
    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' ORDER BY table_name`
    );
    console.log('📋 Tables in database:');
    tables.rows.forEach(r => console.log(`   - ${r.table_name}`));

    const users = await pool.query(
      `SELECT username, email, role, is_active FROM users`
    );
    console.log('\n👤 Users in database:');
    if (users.rowCount === 0) {
      console.log('   (none)');
    } else {
      users.rows.forEach(u =>
        console.log(`   ${u.username} | ${u.email} | ${u.role} | active=${u.is_active}`)
      );
    }

    await pool.end();
    console.log('\n✅ Database setup complete!\n');
  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    process.exit(1);
  }
}

main();
