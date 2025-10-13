# ERP Manufactura MX

Solución ERP lista para producción separada en backend (Node.js + Supabase/PostgreSQL) y frontend (React + Vite) orientada a una empresa
de manufactura ligera en México (idioma español, moneda MXN, impuestos IVA/ISR).

## Estructura

- `backend/`: API REST Express + TypeScript con RBAC, auditoría y migraciones PostgreSQL.
- `frontend/`: Aplicación React con dashboard, módulos y reportes.
- `docs/`: Diagramas ER, flujos BPMN y lineamientos de arquitectura.

## Puesta en marcha rápida (local)

```bash
# Backend
npm --prefix backend install
cp backend/.env.example backend/.env
psql "$DATABASE_URL" -f backend/migrations/001_init.sql
npm --prefix backend run dev

# Frontend
npm --prefix frontend install
cp frontend/.env.example frontend/.env
npm --prefix frontend run dev
```

Ambos servicios corren en `http://localhost:3001` (API) y `http://localhost:5173` (UI). El frontend proxea `/api` al backend cuando no hay `VITE_API_URL`.

## Despliegue gestionado

Este repositorio incluye un archivo `render.yaml` para levantar:

- Un **Web Service** en Render (`backend/`) conectado a una base de datos Supabase.
- Un **Static Site** en Render (`frontend/`) que consume la API pública generada por el backend.

### Pasos

1. Configura un proyecto en Supabase y crea una base de datos. Obtén la URL `postgresql://` y el `anon/service role key` para usos futuros.
2. En Render crea los secrets necesarios (por ejemplo `supabase-db-url` con la URL de conexión y `jwt-secret` con la clave JWT).
3. Importa el repositorio y permite que Render lea `render.yaml`.
4. Render aprovisionará ambos servicios y propagará la URL del backend al frontend mediante la variable `VITE_API_URL`.
5. Ejecuta las migraciones iniciales desde Render (p. ej. usando `psql` desde un job o conectándote con Supabase SQL Editor).

## Características clave

- Seguridad: JWT, RBAC granular, rate limiting, auditoría estructurada.
- Módulos: catálogos maestros, inventario (PEPS/promedio), compras, ventas, facturación CFDI, contabilidad con asientos automáticos y reportes financieros.
- Reportes: ventas, compras, inventario, aging CxC/CxP, estados financieros.
- API `/api/v1` con validaciones y pruebas unitarias base.

## Documentación adicional

Consulte `docs/README.md` para diagramas, flujos y detalles de cumplimiento.
