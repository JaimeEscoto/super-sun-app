import { randomUUID } from 'crypto';

import { query, queryWithClient, withTransaction } from '../../db/index.js';

export class PurchasingService {
  listPurchaseOrders(status?: string) {
    const where = status ? 'WHERE oc.estado = $1' : '';
    const params = status ? [status] : [];
    return query(
      `SELECT
         oc.oc_id as id,
         oc.numero,
         oc.proveedor_id,
         p.nombre as proveedor_nombre,
         oc.fecha,
         oc.estado,
         oc.moneda,
         oc.total,
         oc.impuestos
       FROM ordenes_compra oc
       JOIN proveedores p ON p.proveedor_id = oc.proveedor_id
       ${where}
       ORDER BY oc.fecha DESC
       LIMIT 100`,
      params
    );
  }

  async getPurchaseOrderById(id: string) {
    const [orden] = await query<{
      id: string;
      numero: string | null;
      proveedor_id: string;
      proveedor_nombre: string;
      fecha: string;
      estado: string;
      moneda: string;
      total: string;
      impuestos: string;
    }>(
      `SELECT
         oc.oc_id as id,
         oc.numero,
         oc.proveedor_id,
         p.nombre as proveedor_nombre,
         TO_CHAR(oc.fecha, 'YYYY-MM-DD') as fecha,
         oc.estado,
         oc.moneda,
         oc.total::TEXT as total,
         oc.impuestos::TEXT as impuestos
       FROM ordenes_compra oc
       JOIN proveedores p ON p.proveedor_id = oc.proveedor_id
       WHERE oc.oc_id = $1`,
      [id]
    );

    return orden ?? null;
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
    const [result] = await query<{ oc_id: string }>(
      `SELECT crear_orden_compra($1::jsonb) as oc_id`,
      [
        JSON.stringify({
          proveedorId: payload.proveedorId,
          fecha: payload.fecha,
          moneda: payload.moneda,
          lineas: payload.lineas,
          condicionesPago: payload.condicionesPago,
          solicitanteId: payload.solicitanteId,
          estado: 'PENDIENTE',
          ...(payload.usuarioId ? { usuarioId: payload.usuarioId } : {})
        })
      ]
    );

    if (!result?.oc_id) {
      throw new Error('No se pudo registrar la orden de compra');
    }

    const orden = await this.getPurchaseOrderById(result.oc_id);

    if (!orden) {
      throw new Error('No se pudo obtener la orden de compra creada');
    }

    return orden;
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
      numero: string | null;
    }>(
      `INSERT INTO ordenes_compra (proveedor_id, fecha, estado, moneda, condiciones_pago, total, impuestos, numero, created_by)
       VALUES (
         $1,
         $2::date,
         $3,
         $4,
         $5,
         $6,
         0,
         'OC-' || TO_CHAR($2::date, 'YYYYMMDD') || '-' || LPAD(nextval('orden_compra_numero_seq')::TEXT, 5, '0'),
         $7
       )
       RETURNING oc_id as id, proveedor_id, fecha, estado, moneda, total, impuestos, numero`,
      [
        proveedorId,
        payload.fecha,
        payload.estado ?? 'PENDIENTE',
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
          estado: payload.estado ?? 'PENDIENTE',
          referencia: payload.referencia ?? null
        }),
        payload.usuarioId ?? null
      ]
    );

    const enriched = await this.getPurchaseOrderById(orden.id);

    if (!enriched) {
      throw new Error('No se pudo obtener la orden rápida registrada');
    }

    return enriched;
  }

  async createGoodsReceipt(payload: {
    ocId?: string;
    fecha: string;
    almacenId: string;
    lineas: Array<{ productoId: string; cantidad: number; costo: number }>;
    referencia?: string;
    usuarioId?: string;
  }) {
    return withTransaction(async (client) => {
      const [recepcion] = await queryWithClient<{
        id: string;
        oc_id: string | null;
        fecha: string;
        estado: string;
      }>(
        client,
        `INSERT INTO recepciones (oc_id, fecha, estado, created_by)
         VALUES ($1, $2::date, 'REGISTRADA', $3)
         RETURNING recepcion_id as id, oc_id, fecha, estado`,
        [payload.ocId ?? null, payload.fecha, payload.usuarioId ?? null]
      );

      const movimientos: Array<{ productoId: string; movimientoId: string }> = [];
      let total = 0;

      for (const linea of payload.lineas) {
        total += linea.cantidad * linea.costo;

        await queryWithClient(
          client,
          `INSERT INTO recepciones_lineas (recepcion_id, producto_id, cantidad, costo)
           VALUES ($1, $2, $3, $4)`,
          [recepcion.id, linea.productoId, linea.cantidad, linea.costo]
        );

        const [movimiento] = await queryWithClient<{ movimiento_id: string }>(
          client,
          `SELECT registrar_ajuste_inventario($1, $2, $3, $4, $5, $6) as movimiento_id`,
          [
            linea.productoId,
            payload.almacenId,
            Math.abs(linea.cantidad),
            `Recepción ${recepcion.id}${payload.referencia ? ` (${payload.referencia})` : ''}`,
            linea.costo,
            payload.usuarioId ?? null
          ]
        );

        movimientos.push({ productoId: linea.productoId, movimientoId: movimiento.movimiento_id });
      }

      const [transaccion] = await queryWithClient<{ transaccion_id: string }>(
        client,
        `INSERT INTO transacciones (tipo, referencia_id, descripcion, datos, created_by)
         VALUES ('RECEPCION_COMPRA', $1, $2, $3::jsonb, $4)
         RETURNING transaccion_id`,
        [
          recepcion.id,
          payload.referencia
            ? `Recepción ${recepcion.id} - ${payload.referencia}`
            : `Recepción ${recepcion.id}`,
          JSON.stringify({
            ocId: payload.ocId ?? null,
            fecha: payload.fecha,
            almacenId: payload.almacenId,
            lineas: payload.lineas,
            total,
            movimientos
          }),
          payload.usuarioId ?? null
        ]
      );

      return {
        recepcion,
        total,
        transaccionId: transaccion.transaccion_id,
        movimientos
      };
    });
  }
}
