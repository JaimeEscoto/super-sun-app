import cors, { type CorsOptions } from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiRouter } from './routes/index.js';

export const createApp = () => {
  const app = express();
  app.use(helmet());

  const allowedOrigins = env.corsAllowedOrigins;

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const originMatchers = allowedOrigins.map<(origin: string) => boolean>((allowedOrigin) => {
    if (allowedOrigin === '*') {
      return () => true;
    }

    if (!allowedOrigin.includes('*')) {
      return (origin: string) => origin === allowedOrigin;
    }

    const pattern = `^${allowedOrigin.split('*').map(escapeRegExp).join('.*')}$`;
    const regex = new RegExp(pattern);
    return (origin: string) => regex.test(origin);
  });

  const isOriginAllowed = (origin: string | undefined) => {
    if (!origin) {
      return true;
    }

    return originMatchers.some((matcher) => matcher(origin));
  };

  const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    }
  };

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('combined'));
  app.use(
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      max: env.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false
    })
  );

  app.use('/api/v1', apiRouter);
  app.use(errorHandler);

  return app;
};
