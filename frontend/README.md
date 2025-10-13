# ERP Frontend

Interfaz React + Vite para el ERP de manufactura en México.

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
| `VITE_API_URL` | URL pública del backend (por ejemplo, el Web Service de Render). Si no se define se usa el proxy local `/api`. |

## Despliegue en Render

1. Crea un servicio **Static Site** apuntando al directorio `frontend/`.
2. Usa el build command `npm install && npm run build` y publica `dist/`.
3. Define la variable `VITE_API_URL` apuntando al dominio del backend desplegado en Render.
4. Si utilizas `render.yaml`, la variable se genera automáticamente tomando la URL pública del backend.

## Características

- Dashboard con KPIs y gráficas (React Query + Recharts).
- Vistas maestro-detalle para catálogos, inventario, compras, ventas, facturación y contabilidad.
- Diseño responsive con Tailwind CSS en modo oscuro.
- Integración con autenticación JWT almacenada en `localStorage`.
- Reportes listos para exportación y filtros.
