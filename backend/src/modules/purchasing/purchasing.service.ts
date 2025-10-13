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
}
