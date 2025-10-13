import { query } from '../../db/index.js';

export class BillingService {
  listInvoices(params: { clienteId?: string; estado?: string }) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (params.clienteId) {
      values.push(params.clienteId);
      conditions.push(`cliente_id = $${values.length}`);
    }

    if (params.estado) {
      values.push(params.estado);
      conditions.push(`estado = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    return query(
      `SELECT factura_id as id, numero, cliente_id, fecha_emision, moneda, total, estado
       FROM facturas
       ${where}
       ORDER BY fecha_emision DESC
       LIMIT 100`,
      values
    );
  }

  async createInvoice(payload: {
    pedidoId: string;
    fechaEmision: string;
    moneda: string;
    tipoComprobante: string;
    lineas: Array<{
      descripcion: string;
      cantidad: number;
      precioUnitario: number;
      impuestos: Array<{ tipoImpuestoId: string; tasa: number }>;
    }>;
  }) {
    return query(
      `SELECT emitir_factura($1::jsonb) as factura_id`,
      [
        JSON.stringify({
          pedidoId: payload.pedidoId,
          fechaEmision: payload.fechaEmision,
          moneda: payload.moneda,
          tipoComprobante: payload.tipoComprobante,
          lineas: payload.lineas
        })
      ]
    );
  }
}
