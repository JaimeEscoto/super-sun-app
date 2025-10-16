import { query, queryWithClient, withTransaction } from '../../db/index.js';

export class SalesService {
  listOrders(status?: string) {
    const where = status ? 'WHERE estado = $1' : '';
    const params = status ? [status] : [];
    return query(
      `SELECT pedido_id as id, cliente_id, fecha, estado, total, moneda
       FROM pedidos
       ${where}
       ORDER BY fecha DESC
       LIMIT 100`,
      params
    );
  }

  async createOrder(payload: {
    clienteId: string;
    fecha: string;
    moneda: string;
    vendedorId?: string;
    condicionesPago: string;
    lineas: Array<{ productoId: string; cantidad: number; precio: number; descuentos?: number }>;
    usuarioId?: string;
  }) {
    return query(
      `SELECT crear_pedido($1::jsonb) as pedido_id`,
      [
        JSON.stringify({
          clienteId: payload.clienteId,
          fecha: payload.fecha,
          moneda: payload.moneda,
          vendedorId: payload.vendedorId,
          condicionesPago: payload.condicionesPago,
          lineas: payload.lineas,
          ...(payload.usuarioId ? { usuarioId: payload.usuarioId } : {})
        })
      ]
    );
  }

  async createDelivery(payload: {
    pedidoId?: string;
    fecha: string;
    almacenId: string;
    lineas: Array<{ productoId: string; cantidad: number; costoUnitario?: number }>;
    usuarioId?: string;
  }) {
    return withTransaction(async (client) => {
      const movimientos: Array<{ productoId: string; movimientoId: string }> = [];

      for (const linea of payload.lineas) {
        const cantidad = Math.abs(linea.cantidad) * -1;
        const [movimiento] = await queryWithClient<{ movimiento_id: string }>(
          client,
          `SELECT registrar_ajuste_inventario($1, $2, $3, $4, $5, $6) as movimiento_id`,
          [
            linea.productoId,
            payload.almacenId,
            cantidad,
            `Entrega de pedido ${payload.pedidoId ?? 'sin referencia'}`,
            linea.costoUnitario ?? null,
            payload.usuarioId ?? null
          ]
        );

        movimientos.push({ productoId: linea.productoId, movimientoId: movimiento.movimiento_id });
      }

      const referenciaId = payload.pedidoId ?? movimientos[0]?.movimientoId;

      if (!referenciaId) {
        throw new Error('No fue posible determinar la referencia de la entrega');
      }

      const [transaccion] = await queryWithClient<{ transaccion_id: string }>(
        client,
        `INSERT INTO transacciones (tipo, referencia_id, descripcion, datos, created_by)
         VALUES ('ENTREGA_VENTA', $1, $2, $3::jsonb, $4)
         RETURNING transaccion_id`,
        [
          referenciaId,
          payload.pedidoId
            ? `Entrega registrada para pedido ${payload.pedidoId}`
            : 'Entrega de venta sin pedido asociado',
          JSON.stringify({
            pedidoId: payload.pedidoId ?? null,
            fecha: payload.fecha,
            almacenId: payload.almacenId,
            lineas: payload.lineas,
            movimientos
          }),
          payload.usuarioId ?? null
        ]
      );

      return {
        transaccionId: transaccion.transaccion_id,
        movimientos
      };
    });
  }
}
