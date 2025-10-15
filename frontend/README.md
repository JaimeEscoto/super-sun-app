# ERP Frontend

Interfaz React + Vite para el ERP de manufactura en Honduras.

## Requisitos

- Node.js >= 20

## Instalación local

```bash
cp .env.example .env # opcional: ajusta VITE_API_URL si no usas proxy local
npm install
npm run dev
```

El servidor se expone en `http://localhost:5173` y proxea `/api` al backend cuando `VITE_API_URL` no está definido.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base de la API. En Render se fija a `/api/v1` para usar el proxy del Static Site; en local puedes apuntarla a otra URL o dejarla vacía para usar `/api`. |

## Despliegue en Render

1. Crea un servicio **Static Site** apuntando al directorio `frontend/`.
2. Usa el build command `npm install && npm run build` y publica `dist/`.
3. Configura un rewrite/proxy `/api/*` → backend para evitar CORS (incluido en `render.yaml`).
4. Define `VITE_API_URL=/api/v1` (viene preconfigurado en `.env.production` y en `render.yaml`).

## Características

- Dashboard con KPIs y gráficas (React Query + Recharts).
- Vistas maestro-detalle para catálogos, inventario, compras, ventas, facturación y contabilidad.
- Diseño responsive con Tailwind CSS en modo oscuro.
- Integración con autenticación JWT almacenada en `localStorage`.
- Reportes listos para exportación y filtros.
