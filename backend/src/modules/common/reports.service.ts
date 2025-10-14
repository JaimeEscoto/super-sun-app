import { query } from '../../db/index.js';

const formatCurrency = (value: unknown) =>
  new Intl.NumberFormat('es-HN', {
    style: 'currency',
    currency: 'HNL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(typeof value === 'number' ? value : typeof value === 'string' ? Number(value) || 0 : 0);

const parseNumeric = (value: unknown) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

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

  async executiveSummary() {
    const [salesMonth] = await query<{ total: string }>(
      `SELECT COALESCE(SUM(total), 0)::numeric AS total
       FROM facturas
       WHERE date_trunc('month', fecha_emision) = date_trunc('month', CURRENT_DATE)`
    );

    const [marginMonth] = await query<{ total: string }>(
      `SELECT COALESCE(SUM(margen), 0)::numeric AS total
       FROM reporte_ventas_cliente
       WHERE date_trunc('month', fecha) = date_trunc('month', CURRENT_DATE)`
    );

    const [inventoryTurnover] = await query<{ dias: string }>(
      `SELECT COALESCE(AVG(dias_en_inventario), 0)::numeric AS dias
       FROM reporte_antiguedad_inventario`
    );

    const [receivables] = await query<{ total: string }>(
      `SELECT COALESCE(SUM(total), 0)::numeric AS total
       FROM reporte_antiguedad_cxc_cxp
       WHERE tipo = 'CXC'`
    );

    return {
      ventasMes: formatCurrency(salesMonth?.total ?? 0),
      margen: formatCurrency(marginMonth?.total ?? 0),
      inventarioDias: Math.round(parseNumeric(inventoryTurnover?.dias ?? 0)).toString(),
      carteraVencida: formatCurrency(receivables?.total ?? 0)
    };
  }
}
