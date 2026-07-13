/**
 * seedAdmin.js
 *
 * Creates the initial Owner/Admin user from environment variables.
 * This is the ONLY sanctioned way to bootstrap the first privileged user.
 *
 * Usage:
 *   node server/scripts/seedAdmin.js
 *
 * Required environment variables (set in server/.env):
 *   SEED_USERNAME   — default: admin
 *   SEED_EMAIL      — default: admin@factoryerp.com
 *   SEED_PASSWORD   — REQUIRED in production; no hardcoded default
 *   SEED_ROLE       — default: Admin  (valid: Owner | Admin)
 *
 * Security:
 *   - Never commit real credentials to source control.
 *   - Change the password immediately after first login.
 *   - In production, set SEED_PASSWORD via a secrets manager or CI secret.
 */

import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env relative to the server root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const VALID_SEED_ROLES = ['Owner', 'Admin'];

const seedAdmin = async () => {
  const username = process.env.SEED_USERNAME || 'admin';
  const email    = process.env.SEED_EMAIL    || 'admin@factoryerp.com';
  const role     = process.env.SEED_ROLE     || 'Admin';
  const password = process.env.SEED_PASSWORD;

  // --- Guard: enforce password via env in all environments ---
  if (!password) {
    console.error('❌ SEED_PASSWORD environment variable is not set.');
    console.error('   Set it in server/.env before running this script.');
    process.exit(1);
  }

  if (!VALID_SEED_ROLES.includes(role)) {
    console.error(`❌ SEED_ROLE "${role}" is invalid. Must be one of: ${VALID_SEED_ROLES.join(', ')}`);
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to database...');

    // Check for existing user (by username OR email) to remain idempotent
    const existing = await pool.query(
      'SELECT id, username FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existing.rowCount > 0) {
      console.log(`ℹ️  User "${existing.rows[0].username}" already exists — skipping seed.`);
      process.exit(0);
    }

    // Hash password with a strong work factor
    const SALT_ROUNDS = 12;
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const insertQuery = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role
    `;

    const result = await pool.query(insertQuery, [username, email, passwordHash, role]);
    const seeded = result.rows[0];

    console.log('✅ Seed user created successfully:');
    console.log(`   ID       : ${seeded.id}`);
    console.log(`   Username : ${seeded.username}`);
    console.log(`   Email    : ${seeded.email}`);
    console.log(`   Role     : ${seeded.role}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password immediately after first login.');

  } catch (error) {
    console.error('❌ Error seeding user:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

seedAdmin();
