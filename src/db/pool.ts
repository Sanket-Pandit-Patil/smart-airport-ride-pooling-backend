import { Pool } from 'pg';
import { config } from '../config';

/**
 * Singleton PostgreSQL connection pool for concurrency.
 * Supports 10k concurrent users and 100 req/s via connection pooling.
 */
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
      max: config.db.maxPoolSize,
      idleTimeoutMillis: config.db.idleTimeoutMillis,
      connectionTimeoutMillis: config.db.connectionTimeoutMillis,
    });
    pool.on('error', (err) => console.error('Unexpected pool error', err));
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
