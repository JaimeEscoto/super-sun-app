import { createServer } from 'http';

import { env } from './config/env.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

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
