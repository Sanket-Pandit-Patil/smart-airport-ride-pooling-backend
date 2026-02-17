import app from './app';
import { config } from './config';
import { getPool } from './db/pool';
import { startMatchingCron } from './cron';
import { ensureDefaultCabs } from './repositories/cab-repository';

const PORT = config.port;

// Start the cron job for ride matching
startMatchingCron();

async function start() {
  try {
    await getPool().query('SELECT 1');
  } catch (e) {
    console.error('Database connection failed. Ensure PostgreSQL is running and env (PG_*) is set.');
    process.exit(1);
  }

  try {
    await ensureDefaultCabs();
  } catch (e) {
    console.warn('Could not ensure default cabs (migrations may not have run):', e);
  }

  app.listen(config.port, () => {
    console.log(`Smart Airport Ride Pooling API listening on port ${config.port}`);
    console.log(`Docs: http://localhost:${config.port}/api-docs`);
  });
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});
