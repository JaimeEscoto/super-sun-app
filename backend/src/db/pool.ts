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

try {
  const parsedUrl = new URL(env.databaseUrl);
  const databaseName = parsedUrl.pathname.replace('/', '') || 'desconocida';
  const port = parsedUrl.port || '5432';
  logger.info(
    `Inicializando pool de conexiones a la base de datos ${databaseName} en ${parsedUrl.hostname}:${port}`
  );
} catch (error) {
  logger.warn('No se pudo analizar la cadena de conexión de la base de datos', error);
}

export const pool = new Pool(poolConfig);

pool.on('connect', () => {
  logger.info('Cliente conectado a la base de datos');
});

pool.on('acquire', () => {
  logger.debug('Cliente del pool adquirido');
});

pool.on('remove', () => {
  logger.info('Cliente del pool liberado');
});

pool.on('error', (error) => {
  logger.error('Database pool error', error);
});
