import { query } from '../../db/index.js';

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
    vendedorId: string;
    condicionesPago: string;
    lineas: Array<{ productoId: string; cantidad: number; precio: number; descuentos?: number }>; 
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
          lineas: payload.lineas
        })
      ]
    );
  }
}
