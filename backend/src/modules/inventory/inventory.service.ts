import { query, queryWithClient, withTransaction } from '../../db/index.js';

export class InventoryService {
  async getKardex(productoId: string, almacenId?: string) {
    const params: unknown[] = [productoId];
    let filter = 'producto_id = $1';

    if (almacenId) {
      params.push(almacenId);
      filter += ` AND almacen_id = $${params.length}`;
    }

    return query(
      `SELECT fecha, tipo, cantidad, costo_unitario, saldo_cantidad, saldo_costo
       FROM kardex
       WHERE ${filter}
       ORDER BY fecha ASC`,
      params
    );
  }

  async getValuation() {
    return query(
      `SELECT producto_id, SUM(cantidad * costo_unitario) as valor_total, SUM(cantidad) as existencias
       FROM stock_valuado
       GROUP BY producto_id`
    );
  }

  async createAdjustment(payload: {
    productoId: string;
    almacenId: string;
    cantidad: number;
    motivo: string;
    costoUnitario?: number;
    usuarioId?: string;
  }) {
    return query(
      `SELECT registrar_ajuste_inventario($1, $2, $3, $4, $5, $6) as ajuste_id`,
      [
        payload.productoId,
        payload.almacenId,
        payload.cantidad,
        payload.motivo,
        payload.costoUnitario ?? null,
        payload.usuarioId ?? null
      ]
    );
  }

  async createTransfer(payload: {
    origenId: string;
    destinoId: string;
    motivo: string;
    lineas: Array<{ productoId: string; cantidad: number; costoUnitario?: number }>;
    usuarioId?: string;
  }) {
    return withTransaction(async (client) => {
      const movimientos: Array<{
        productoId: string;
        salidaId: string;
        entradaId: string;
      }> = [];

      for (const linea of payload.lineas) {
        const cantidad = Math.abs(linea.cantidad);

        const [salida] = await queryWithClient<{ movimiento_id: string }>(
          client,
          `SELECT registrar_ajuste_inventario($1, $2, $3, $4, $5, $6) as movimiento_id`,
          [
            linea.productoId,
            payload.origenId,
            cantidad * -1,
            `Transferencia a ${payload.destinoId}: ${payload.motivo}`,
            linea.costoUnitario ?? null,
            payload.usuarioId ?? null
          ]
        );

        const [entrada] = await queryWithClient<{ movimiento_id: string }>(
          client,
          `SELECT registrar_ajuste_inventario($1, $2, $3, $4, $5, $6) as movimiento_id`,
          [
            linea.productoId,
            payload.destinoId,
            cantidad,
            `Transferencia desde ${payload.origenId}: ${payload.motivo}`,
            linea.costoUnitario ?? null,
            payload.usuarioId ?? null
          ]
        );

        movimientos.push({
          productoId: linea.productoId,
          salidaId: salida.movimiento_id,
          entradaId: entrada.movimiento_id
        });
      }

      const referenciaId = movimientos[0]?.salidaId ?? movimientos[0]?.entradaId;

      if (!referenciaId) {
        throw new Error('No se generaron movimientos para la transferencia');
      }

      const [transaccion] = await queryWithClient<{ transaccion_id: string }>(
        client,
        `INSERT INTO transacciones (tipo, referencia_id, descripcion, datos, created_by)
         VALUES ('TRANSFERENCIA_INVENTARIO', $1, $2, $3::jsonb, $4)
         RETURNING transaccion_id`,
        [
          referenciaId,
          `Transferencia ${payload.origenId} ➜ ${payload.destinoId}`,
          JSON.stringify({
            origenId: payload.origenId,
            destinoId: payload.destinoId,
            motivo: payload.motivo,
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
