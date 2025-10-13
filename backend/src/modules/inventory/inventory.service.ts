import { query } from '../../db/index.js';

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
  }) {
    return query(
      `SELECT registrar_ajuste_inventario($1, $2, $3, $4, $5) as ajuste_id`,
      [
        payload.productoId,
        payload.almacenId,
        payload.cantidad,
        payload.motivo,
        payload.costoUnitario ?? null
      ]
    );
  }
}
