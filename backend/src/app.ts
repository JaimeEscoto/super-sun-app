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

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const buildMatcher = (pattern: string) => {
    if (pattern.includes('*')) {
      const regex = new RegExp(`^${escapeRegExp(pattern).replace(/\\\*/g, '.*')}$`);
      return (origin: string) => regex.test(origin);
    }

    return (origin: string) => origin === pattern;
  };

  const allowAllOrigins = env.corsAllowedOrigins.includes('*');
  const originMatchers = env.corsAllowedOrigins
    .filter((pattern) => pattern !== '*')
    .map(buildMatcher);

  const corsOptions: CorsOptions = allowAllOrigins
    ? { origin: true, credentials: true }
    : {
        origin: (requestOrigin, callback) => {
          if (!requestOrigin) {
            callback(null, true);
            return;
          }

          const isAllowed = originMatchers.some((matcher) => matcher(requestOrigin));

          callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
        },
        credentials: true
      };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
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
