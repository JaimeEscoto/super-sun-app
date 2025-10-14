# ERP Backend

API REST para ERP de manufactura ligera en Honduras (HNL) con idioma español.

## Requisitos

- Node.js >= 20
- PostgreSQL 15+ (compatible con la instancia de Supabase)

## Configuración local

```bash
cp .env.example .env
npm install
npm run dev
```

Ejecutar migraciones iniciales:

```bash
psql "$DATABASE_URL" -f migrations/001_init.sql
```

### Variables de entorno

| Variable | Descripción |
| --- | --- |
| `PORT` | Puerto de ejecución del servicio. |
| `SUPABASE_URL` | URL del proyecto Supabase para consumir la API REST. |
| `SUPABASE_ANON_KEY` | Clave anónima de Supabase para las operaciones permitidas. |
| `JWT_SECRET` | Clave de firma para los tokens JWT. |
| `JWT_EXPIRES_IN` | Tiempo de expiración JWT (por defecto `7d`). |
| `CORS_ALLOWED_ORIGINS` | Lista de orígenes permitidos separados por coma. Usa `*` para permitir todos o comodines (por ejemplo `https://super-sun-app*.onrender.com`). |

Configura las credenciales públicas de Supabase (URL y anon key) desde la consola del proyecto.

## Scripts

- `npm run dev`: servidor en desarrollo.
- `npm run build`: compila a `build/` usando tsup.
- `npm run start`: ejecuta versión compilada.
- `npm run lint`: ESLint + reglas de estilo.
- `npm run test`: pruebas unitarias con Vitest.
- `npm run seed`: inserta datos de prueba en todas las tablas principales.

## Despliegue en Render

1. Crea un servicio **Web Service** de tipo Node.js apuntando al directorio `backend/`.
2. Utiliza el build command `npm install && npm run build` y el start command `npm run start`.
3. Configura variables de entorno:
   - `SUPABASE_URL` y `SUPABASE_ANON_KEY` desde los valores del proyecto Supabase.
   - `JWT_SECRET` con una clave segura.
   - `JWT_EXPIRES_IN` opcional (por defecto `7d`).
4. Render asignará el `PORT` automáticamente.

El archivo `render.yaml` en la raíz automatiza esta configuración y vincula el frontend para que reciba la URL pública del backend.

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
