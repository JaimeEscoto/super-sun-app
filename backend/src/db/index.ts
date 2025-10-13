import { pool } from './pool.js';

export const query = async <T>(text: string, params: unknown[] = []): Promise<T[]> => {
  const client = await pool.connect();
  try {
    const result = await client.query<T>(text, params);
    return result.rows;
  } finally {
    client.release();
  }
};
