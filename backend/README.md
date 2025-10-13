# ERP Backend

API REST para ERP de manufactura ligera en México (MXN) con idioma español.

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
| `DATABASE_URL` | URL de conexión de PostgreSQL/Supabase. |
| `DATABASE_SSL` | Define si se fuerza conexión SSL (poner en `true` para Supabase). |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | Controla la validación del certificado (usar `false` para Supabase). |
| `JWT_SECRET` | Clave de firma para los tokens JWT. |
| `JWT_EXPIRES_IN` | Tiempo de expiración JWT (por defecto `8h`). |
| `PORT` | Puerto de ejecución del servicio (Render lo inyecta automáticamente). |

Para conectar con Supabase usa la cadena `postgresql://` que aparece en `Project Settings > Database` y establece:

```env
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

## Scripts

- `npm run dev`: servidor en desarrollo.
- `npm run build`: compila a `build/` usando tsup.
- `npm run start`: ejecuta versión compilada.
- `npm run lint`: ESLint + reglas de estilo.
- `npm run test`: pruebas unitarias con Vitest.

## Despliegue en Render

1. Crea un servicio **Web Service** de tipo Node.js apuntando al directorio `backend/`.
2. Utiliza el build command `npm install && npm run build` y el start command `npm run start`.
3. Configura variables de entorno:
   - `DATABASE_URL` desde un secret con la URL de Supabase.
   - `DATABASE_SSL=true` y `DATABASE_SSL_REJECT_UNAUTHORIZED=false` para forzar TLS.
   - `JWT_SECRET` con una clave segura.
4. Render asignará el `PORT`; no lo sobrescribas.

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
