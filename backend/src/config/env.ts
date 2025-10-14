import 'dotenv/config';

const required = ['JWT_SECRET', 'DATABASE_URL'];

const parseOrigins = (value: string | undefined) => {
  if (!value) {
    return ['*'];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

const parseBoolean = (value: string | undefined, defaultValue: boolean) => {
  if (value === undefined) {
    return defaultValue;
  }

  return value === 'true' || value === '1';
};

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Environment variable ${key} is required`);
  }
});

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  databaseUrl: process.env.DATABASE_URL as string,
  databaseSsl: parseBoolean(process.env.DATABASE_SSL, false),
  databaseSslRejectUnauthorized: parseBoolean(
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED,
    true
  ),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 100),
  corsAllowedOrigins: parseOrigins(process.env.CORS_ALLOWED_ORIGINS)
};
