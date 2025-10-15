import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cors, { type CorsOptions } from 'cors';

import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { apiRouter } from './routes/index.js';

export const createApp = () => {
  const app = express();
  app.use(helmet());
  const corsOptions: CorsOptions = env.corsAllowedOrigins.includes('*')
    ? {
        origin: true,
        credentials: true
      }
    : {
        origin: (origin, callback) => {
          if (!origin || env.corsAllowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error('Origin not allowed by CORS'));
          }
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
