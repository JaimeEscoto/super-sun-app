# ERP Manufactura MX

Solución ERP lista para producción separada en backend (Node.js + PostgreSQL) y frontend (React + Vite) orientada a una empresa de manufactura ligera en México (idioma español, moneda MXN, impuestos IVA/ISR).

## Estructura

- `backend/`: API REST Express + TypeScript con RBAC, auditoría y migraciones PostgreSQL.
- `frontend/`: Aplicación React con dashboard, módulos y reportes.
- `docs/`: Diagramas ER, flujos BPMN y lineamientos de arquitectura.

## Puesta en marcha rápida

```bash
# Backend
yarn --cwd backend install
cp backend/.env.example backend/.env
psql "$DATABASE_URL" -f backend/migrations/001_init.sql
yarn --cwd backend dev

# Frontend
yarn --cwd frontend install
yarn --cwd frontend dev
```

Ambos servicios corren en `http://localhost:3001` (API) y `http://localhost:5173` (UI). El frontend proxea `/api` al backend.

## Características clave

- Seguridad: JWT, RBAC granular, rate limiting, auditoría estructurada.
- Módulos: catálogos maestros, inventario (PEPS/promedio), compras, ventas, facturación CFDI, contabilidad con asientos automáticos y reportes financieros.
- Reportes: ventas, compras, inventario, aging CxC/CxP, estados financieros.
- API `/api/v1` con validaciones y pruebas unitarias base.

## Documentación adicional

Consulte `docs/README.md` para diagramas, flujos y detalles de cumplimiento.
