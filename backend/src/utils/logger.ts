import winston from 'winston';

import { env } from '../config/env.js';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: time, stack }) => {
  return stack ? `${time} ${level}: ${stack}` : `${time} ${level}: ${message}`;
});

export const logger = winston.createLogger({
  level: env.logLevel,
  format: combine(
    errors({ stack: true }),
    timestamp(),
    env.nodeEnv === 'development' ? colorize() : winston.format.uncolorize(),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
      handleExceptions: true
    })
  ]
});
