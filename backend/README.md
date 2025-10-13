# ERP Backend

API REST para ERP de manufactura ligera en México (MXN) con idioma español.

## Requisitos

- Node.js >= 20
- PostgreSQL 15+

## Configuración

```bash
cp .env.example .env
npm install
npm run dev
```

Ejecutar migraciones iniciales:

```bash
psql "$DATABASE_URL" -f migrations/001_init.sql
```

## Scripts

- `npm run dev`: servidor en desarrollo.
- `npm run build`: compila a `build/` usando tsup.
- `npm run start`: ejecuta versión compilada.
- `npm run lint`: ESLint + reglas de estilo.
- `npm run test`: pruebas unitarias con Vitest.

## Arquitectura

- `src/app.ts`: configuración de Express con seguridad (Helmet, rate limiting, logs).
- `src/modules/*`: módulos funcionales (catálogos, inventario, compras, ventas, facturación, contabilidad, reportes).
- `src/middleware`: autenticación JWT, autorización RBAC y auditoría.
- `src/db`: pool PostgreSQL y utilidades de consulta.
- `migrations/001_init.sql`: esquema relacional inicial y vistas de reportes.

## Seguridad

- Autenticación JWT, expiración configurable.
- RBAC basado en matriz de permisos.
- Auditoría mediante logs estructurados `AUDIT`.
- Rate limiting configurable.

## Estándares

- Tipado estricto con TypeScript.
- Validación de entradas con Joi.
- Logs estructurados con Winston.
- Cobertura mínima de pruebas sobre reglas críticas (p.ej. permisos).
