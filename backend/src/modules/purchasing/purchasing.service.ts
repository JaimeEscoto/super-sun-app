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
    usuarioId?: string;
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
          solicitanteId: payload.solicitanteId,
          ...(payload.usuarioId ? { usuarioId: payload.usuarioId } : {})
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
    usuarioId?: string;
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
        `INSERT INTO proveedores (nombre, nif, direccion, contactos, banco, retenciones, saldo, created_by)
         VALUES ($1, $2, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, '[]'::jsonb, 0, $3)
         RETURNING proveedor_id`,
        [payload.proveedorNombre, rtn, payload.usuarioId ?? null]
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
      `INSERT INTO ordenes_compra (proveedor_id, fecha, estado, moneda, condiciones_pago, total, impuestos, created_by)
       VALUES ($1, $2::date, $3, $4, $5, $6, 0, $7)
       RETURNING oc_id as id, proveedor_id, fecha, estado, moneda, total, impuestos`,
      [
        proveedorId,
        payload.fecha,
        payload.estado ?? 'BORRADOR',
        payload.moneda,
        condiciones,
        payload.total,
        payload.usuarioId ?? null
      ]
    );

    await query(
      `INSERT INTO transacciones (tipo, referencia_id, descripcion, datos, created_by)
       VALUES ('ORDEN_COMPRA', $1, $2, $3::jsonb, $4)`,
      [
        orden.id,
        payload.referencia
          ? `Orden rápida ${payload.referencia}`
          : 'Orden de compra creada desde acciones rápidas',
        JSON.stringify({
          proveedorId,
          fecha: payload.fecha,
          moneda: payload.moneda,
          total: payload.total,
          estado: payload.estado ?? 'BORRADOR',
          referencia: payload.referencia ?? null
        }),
        payload.usuarioId ?? null
      ]
    );

    return orden;
  }
}
