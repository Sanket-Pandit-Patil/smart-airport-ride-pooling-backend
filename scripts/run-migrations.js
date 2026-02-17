/**
 * Run migrations using same env as app (PG_HOST, PG_USER, etc.)
 * Usage: node scripts/run-migrations.js
 */
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config();


const host = process.env.PG_HOST || 'localhost';
const port = process.env.PG_PORT || '5432';
const database = process.env.PG_DATABASE || 'airport_pooling';
const user = process.env.PG_USER || 'postgres';
const password = process.env.PG_PASSWORD || 'postgres';

process.env.DATABASE_URL = `postgres://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
process.chdir(path.join(__dirname, '..'));
execSync('node node_modules/node-pg-migrate/bin/node-pg-migrate up -m src/db/migrations', { stdio: 'inherit' });
