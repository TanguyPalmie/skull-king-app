/**
 * Migration runner for the Taggy API.
 *
 * - Connects to PostgreSQL using DATABASE_URL from env (loads dotenv).
 * - Reads .sql files from src/db/migrations/ in alphabetical order.
 * - Runs each migration inside a transaction.
 * - Tracks applied migrations in a `schema_migrations` table so it is
 *   safe to run multiple times.
 */

const path = require('path');
const fs = require('fs');
const { Client } = require('pg');

// Load .env from the api package root (two levels up from src/db/)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query(
    'SELECT name FROM schema_migrations ORDER BY name'
  );
  return new Set(rows.map((r) => r.name));
}

async function getMigrationFiles() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  return files;
}

async function runMigration(client, fileName) {
  const filePath = path.join(MIGRATIONS_DIR, fileName);
  const sql = fs.readFileSync(filePath, 'utf-8');

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      'INSERT INTO schema_migrations (name) VALUES ($1)',
      [fileName]
    );
    await client.query('COMMIT');
    console.log(`  [OK] ${fileName}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`  [FAIL] ${fileName}: ${err.message}`);
    throw err;
  }
}

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });

  try {
    await client.connect();
    console.log('Connected to database.');

    await ensureMigrationsTable(client);

    const applied = await getAppliedMigrations(client);
    const files = await getMigrationFiles();

    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log('No pending migrations. Database is up to date.');
    } else {
      console.log(`Found ${pending.length} pending migration(s):`);
      for (const file of pending) {
        await runMigration(client, file);
      }
      console.log('All migrations applied successfully.');
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

migrate();
