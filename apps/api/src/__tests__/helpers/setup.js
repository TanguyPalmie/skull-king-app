const { Pool } = require('pg');

const TEST_DB_URL = process.env.DATABASE_URL || 'postgres://taggy_test:taggy_test@localhost:5433/taggy_test';
let pool;

function getPool() {
  if (!pool) pool = new Pool({ connectionString: TEST_DB_URL });
  return pool;
}

async function cleanDb() {
  const p = getPool();
  await p.query(`
    DO $$ DECLARE r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'schema_migrations' AND tablename != 'sports' AND tablename != 'languages') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
      END LOOP;
    END $$;
  `);
}

async function createTestUser(overrides = {}) {
  const bcrypt = require('bcryptjs');
  const p = getPool();
  const phone = overrides.phone || '+33600000099';
  const passHash = overrides.password ? await bcrypt.hash(overrides.password, 10) : null;
  const result = await p.query(
    `INSERT INTO users (phone_e164, phone_verified_at, email, password_hash, display_name, birthdate)
     VALUES ($1, NOW(), $2, $3, $4, $5) RETURNING *`,
    [phone, overrides.email || null, passHash, overrides.displayName || 'Test User', overrides.birthdate || '1995-01-15']
  );
  return result.rows[0];
}

async function closePool() {
  if (pool) { await pool.end(); pool = null; }
}

module.exports = { getPool, cleanDb, createTestUser, closePool };
