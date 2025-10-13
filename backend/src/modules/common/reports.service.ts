import { query } from '../../db/index.js';

export class ReportsService {
  salesByCustomer(params: { desde?: string; hasta?: string }) {
    const values: unknown[] = [];
    const conditions: string[] = [];

    if (params.desde) {
      values.push(params.desde);
      conditions.push(`fecha >= $${values.length}`);
    }

    if (params.hasta) {
      values.push(params.hasta);
      conditions.push(`fecha <= $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return query(
      `SELECT cliente_id, SUM(total) as total_ventas, SUM(margen) as margen
       FROM reporte_ventas_cliente
       ${where}
       GROUP BY cliente_id
       ORDER BY total_ventas DESC`,
      values
    );
  }

  inventoryAging() {
    return query(
      `SELECT producto_id, almacen_id, dias_en_inventario, cantidad, valor
       FROM reporte_antiguedad_inventario`
    );
  }

  receivablesPayablesAging() {
    return query(
      `SELECT tipo, tramo, total FROM reporte_antiguedad_cxc_cxp`
    );
  }
}
