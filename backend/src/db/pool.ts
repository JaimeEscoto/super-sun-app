import pg from 'pg';

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000
});

pool.on('error', (error) => {
  logger.error('Database pool error', error);
});
