import { createServer } from 'http';

import { env } from './config/env.js';
import { createApp } from './app.js';
import { runMigrations } from './db/migrate.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  try {
    await runMigrations();
  } catch (error) {
    logger.error('No se pudieron ejecutar las migraciones', error);
    process.exit(1);
  }

  const app = createApp();
  const server = createServer(app);

  server.listen(env.port, () => {
    logger.info(`ERP backend escuchando en puerto ${env.port}`);
  });

  const shutdown = () => {
    logger.info('Deteniendo servidor...');
    server.close(() => {
      logger.info('Servidor detenido');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

await startServer();
