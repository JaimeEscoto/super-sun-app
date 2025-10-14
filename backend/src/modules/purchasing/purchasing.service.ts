import { randomUUID } from 'crypto';

import { query } from '../../db/index.js';

export class PurchasingService {
  listPurchaseOrders(status?: string) {
    const where = status ? 'WHERE estado = $1' : '';
    const params = status ? [status] : [];
    return query(
      `SELECT oc_id as id, proveedor_id, fecha, estado, moneda, total, impuestos
       FROM ordenes_compra
       ${where}
       ORDER BY fecha DESC
       LIMIT 100`,
      params
    );
  }

  async createPurchaseOrder(payload: {
    proveedorId: string;
    fecha: string;
    moneda: string;
    lineas: Array<{ productoId: string; cantidad: number; precio: number; impuestos: number[] }>;
    condicionesPago: string;
    solicitanteId: string;
  }) {
    return query(
      `SELECT crear_orden_compra($1::jsonb) as oc_id`,
      [
        JSON.stringify({
          proveedorId: payload.proveedorId,
          fecha: payload.fecha,
          moneda: payload.moneda,
          lineas: payload.lineas,
          condicionesPago: payload.condicionesPago,
          solicitanteId: payload.solicitanteId
        })
      ]
    );
  }

  async createQuickPurchaseOrder(payload: {
    proveedorId?: string;
    proveedorNombre: string;
    proveedorRtn?: string;
    fecha: string;
    moneda: string;
    estado?: string;
    condicionesPago?: string;
    total: number;
    referencia?: string;
  }) {
    let proveedorId = payload.proveedorId;

    if (!proveedorId) {
      const [existing] = await query<{ proveedor_id: string }>(
        `SELECT proveedor_id
         FROM proveedores
         WHERE LOWER(nombre) = LOWER($1)
         ORDER BY updated_at DESC
         LIMIT 1`,
        [payload.proveedorNombre]
      );

      proveedorId = existing?.proveedor_id;
    }

    if (!proveedorId) {
      const rtn = payload.proveedorRtn ?? `TEMP-${randomUUID().slice(0, 8).toUpperCase()}`;
      const [created] = await query<{ proveedor_id: string }>(
        `INSERT INTO proveedores (nombre, nif, direccion, contactos, banco, retenciones, saldo)
         VALUES ($1, $2, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, '[]'::jsonb, 0)
         RETURNING proveedor_id`,
        [payload.proveedorNombre, rtn]
      );
      proveedorId = created.proveedor_id;
    }

    const condiciones =
      payload.condicionesPago ??
      (payload.referencia
        ? `Generada desde acciones rápidas (${payload.referencia})`
        : 'Generada desde acciones rápidas');

    const [orden] = await query<{
      id: string;
      proveedor_id: string;
      fecha: string;
      estado: string;
      moneda: string;
      total: string;
      impuestos: string;
    }>(
      `INSERT INTO ordenes_compra (proveedor_id, fecha, estado, moneda, condiciones_pago, total, impuestos)
       VALUES ($1, $2::date, $3, $4, $5, $6, 0)
       RETURNING oc_id as id, proveedor_id, fecha, estado, moneda, total, impuestos`,
      [
        proveedorId,
        payload.fecha,
        payload.estado ?? 'BORRADOR',
        payload.moneda,
        condiciones,
        payload.total
      ]
    );

    return orden;
  }
}
