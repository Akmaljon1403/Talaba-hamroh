import pg from 'pg';
import { config } from '../config/env.js';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!pool) {
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL aniqlanmagan. Iltimos, Neon PostgreSQL havolasini kiriting.');
    }

    const isProduction = config.nodeEnv === 'production';
    const isNeon = config.databaseUrl.includes('neon.tech');

    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: isNeon || isProduction ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pool.on('error', (err) => {
      console.error('[DATABASE POOL ERROR]: Kutilmagan baza xatosi:', err.message);
    });
  }

  return pool;
}

export async function query(text, params) {
  const p = getPool();
  const start = Date.now();
  try {
    const res = await p.query(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === 'development') {
      console.log('[DB QUERY]', { text: text.substring(0, 80), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('[DB QUERY ERROR]:', error.message);
    throw error;
  }
}

export async function testConnection() {
  try {
    const p = getPool();
    const res = await p.query('SELECT NOW() as current_time, current_database() as db_name;');
    return {
      success: true,
      time: res.rows[0].current_time,
      db: res.rows[0].db_name
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] Pool to\'xtatildi.');
  }
}
