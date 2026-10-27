import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, closePool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  const pool = getPool();
  const client = await pool.connect();
  try {
    console.log('[MIGRATION] Ma\'lumotlar bazasi sxemasini tekshirish boshlandi...');
    await client.query('BEGIN');

    // Create schema_migrations table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if initial schema migration applied
    const res = await client.query('SELECT version FROM schema_migrations WHERE version = $1', ['001_initial_schema']);
    if (res.rowCount === 0) {
      const schemaSqlPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaSqlPath, 'utf-8');
      
      console.log('[MIGRATION] 001_initial_schema qo\'llanmoqda...');
      await client.query(schemaSql);
      await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', ['001_initial_schema']);
      console.log('[MIGRATION] 001_initial_schema muvaffaqiyatli qo\'llandi.');
    } else {
      console.log('[MIGRATION] 001_initial_schema allaqachon mavjud, o\'tkazib yuborildi.');
    }

    // Stable source identities keep admin-renamed seed records from being duplicated on restart.
    const seedIdentityMigration = await client.query(
      'SELECT version FROM schema_migrations WHERE version = $1',
      ['002_seed_entity_identity']
    );
    if (seedIdentityMigration.rowCount === 0) {
      console.log('[MIGRATION] 002_seed_entity_identity qo\'llanmoqda...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS seed_entity_identity (
          seed_key TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          entity_id INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (entity_type, entity_id)
        );
        CREATE INDEX IF NOT EXISTS idx_seed_entity_identity_entity
          ON seed_entity_identity(entity_type, entity_id);
      `);
      await client.query(
        'INSERT INTO schema_migrations (version) VALUES ($1)',
        ['002_seed_entity_identity']
      );
      console.log('[MIGRATION] 002_seed_entity_identity muvaffaqiyatli qo\'llandi.');
    } else {
      console.log('[MIGRATION] 002_seed_entity_identity allaqachon mavjud, o\'tkazib yuborildi.');
    }

    await client.query('COMMIT');
    console.log('[MIGRATION] Barcha migratsiyalar muvaffaqiyatli bajarildi.');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[MIGRATION ERROR]: Migratsiya jarayonida xatolik yuz berdi:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// CLI runner
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      await closePool();
      console.error(err);
      process.exit(1);
    });
}
