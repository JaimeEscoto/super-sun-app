import { logger } from '../utils/logger.js';
import { pool } from './pool.js';

export const query = async <T>(text: string, params: unknown[] = []): Promise<T[]> => {
  const normalizedQuery = text.replace(/\s+/g, ' ').trim();
  logger.debug(
    params.length > 0
      ? `Ejecutando consulta SQL: ${normalizedQuery} con parámetros ${JSON.stringify(params)}`
      : `Ejecutando consulta SQL: ${normalizedQuery}`
  );

  let client;

  try {
    logger.debug('Solicitando cliente de base de datos del pool');
    client = await pool.connect();
    logger.debug('Cliente de base de datos obtenido');

    const result = await client.query<T>(text, params);
    logger.debug('Consulta SQL ejecutada correctamente');
    return result.rows;
  } catch (error) {
    logger.error('Error al ejecutar la consulta SQL', error);
    throw error;
  } finally {
    if (client) {
      client.release();
      logger.debug('Cliente de base de datos liberado al pool');
    }
  }
};
