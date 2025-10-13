import pg, { type PoolConfig } from 'pg';

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

const poolConfig: PoolConfig = {
  connectionString: env.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000
};

if (env.databaseSsl) {
  poolConfig.ssl = {
    rejectUnauthorized: env.databaseSslRejectUnauthorized
  };
}

export const pool = new Pool(poolConfig);

pool.on('error', (error) => {
  logger.error('Database pool error', error);
});
