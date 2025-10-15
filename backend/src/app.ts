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

  // Seguridad básica
  app.use(helmet());

  // Evita problemas de caché/CDN cuando reflejas dinámicamente el Origin
  app.use((req, res, next) => {
    res.setHeader('Vary', 'Origin');
    next();
  });

  // Utilidades para soportar comodines tipo *.example.com en CORS_ALLOWED_ORIGINS
  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const buildMatcher = (pattern: string) => {
    // Si el patrón incluye '*', lo convertimos a RegExp segura
    if (pattern.includes('*')) {
      const regex = new RegExp(`^${escapeRegExp(pattern).replace(/\\\*/g, '.*')}$`);
      return (origin: string) => regex.test(origin);
    }
    // Match exacto esquema+host(+puerto), sin paths
    return (origin: string) => origin === pattern;
  };

  const allowAllOrigins = env.corsAllowedOrigins.includes('*');
  const originMatchers = env.corsAllowedOrigins
    .filter((pattern) => pattern !== '*')
    .map(buildMatcher);

  // Define métodos/headers explícitos (útil para preflight)
  const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
  const ALLOWED_HEADERS = ['Content-Type', 'Authorization'];
  const EXPOSED_HEADERS = ['X-Request-Id'];

  const corsOptions: CorsOptions =
    allowAllOrigins
      ? {
          origin: true,            // refleja cualquier origen
          credentials: true,       // si usas cookies/credenciales
          methods: ALLOWED_METHODS,
          allowedHeaders: ALLOWED_HEADERS,
          exposedHeaders: EXPOSED_HEADERS,
        }
      : {
          origin: (requestOrigin, callback) => {
            // Algunas herramientas (curl, same-origin) no envían Origin
            if (!requestOrigin) {
              callback(null, true);
              return;
            }
            const isAllowed = originMatchers.some((matcher) => matcher(requestOrigin));
            callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
          },
          credentials: true,       // si usas cookies/credenciales
          methods: ALLOWED_METHODS,
          allowedHeaders: ALLOWED_HEADERS,
          exposedHeaders: EXPOSED_HEADERS,
        };

  // CORS (incluye preflight)
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // Parsers y logging
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('combined'));

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      max: env.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Rutas
  app.use('/api/v1', apiRouter);

  // Manejador de errores
  app.use(errorHandler);

  return app;
};
