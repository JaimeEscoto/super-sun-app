import { NextFunction, Request, Response } from 'express';
import createHttpError from 'http-errors';

import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  const error = createHttpError(err);
  logger.error('Unhandled error', err);
  return res.status(error.statusCode ?? 500).json({
    message: error.message,
    statusCode: error.statusCode ?? 500
  });
};
