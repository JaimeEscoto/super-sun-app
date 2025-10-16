import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { logger } from '../utils/logger.js';
import { pool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../../migrations');

const ensureMigrationsTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
};

export const runMigrations = async () => {
  logger.info('Verificando migraciones pendientes');

  await ensureMigrationsTable();

  let files: string[];
  try {
    files = await fs.readdir(migrationsDir);
  } catch (error) {
    logger.error('No se pudo leer el directorio de migraciones', error);
    throw error;
  }

  const sqlFiles = files.filter((file) => file.endsWith('.sql')).sort();

  for (const file of sqlFiles) {
    const alreadyExecuted = await pool.query<{ exists: boolean }>(
      'SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE name = $1) AS exists',
      [file]
    );

    if (alreadyExecuted.rows[0]?.exists) {
      logger.debug(`Migración ${file} ya ejecutada, se omite`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    logger.info(`Ejecutando migración ${file}`);

    const sql = await fs.readFile(filePath, 'utf8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      logger.info(`Migración ${file} aplicada correctamente`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error al ejecutar la migración ${file}`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  logger.info('Migraciones completadas');
};
