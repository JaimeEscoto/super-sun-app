# ERP Frontend

Interfaz React + Vite para el ERP de manufactura en México.

## Requisitos

- Node.js >= 20

## Instalación

```bash
npm install
npm run dev
```

El servidor se expone en `http://localhost:5173` y proxea `/api` al backend.

## Características

- Dashboard con KPIs y gráficas (React Query + Recharts).
- Vistas maestro-detalle para catálogos, inventario, compras, ventas, facturación y contabilidad.
- Diseño responsive con Tailwind CSS en modo oscuro.
- Integración con autenticación JWT almacenada en `localStorage`.
- Reportes listos para exportación y filtros.
