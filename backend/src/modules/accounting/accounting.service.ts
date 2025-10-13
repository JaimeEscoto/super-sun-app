import { query } from '../../db/index.js';

export class AccountingService {
  listJournalEntries(params: { desde?: string; hasta?: string }) {
    const conditions: string[] = [];
    const values: unknown[] = [];

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
      `SELECT asiento_id as id, fecha, diario, descripcion, total_debe, total_haber
       FROM asientos
       ${where}
       ORDER BY fecha DESC
       LIMIT 200`,
      values
    );
  }

  async getTrialBalance(fechaCorte: string) {
    return query(
      `SELECT cuenta_id, nombre, debe, haber, saldo
       FROM balanza_comprobacion($1)`,
      [fechaCorte]
    );
  }

  async getFinancialStatements(periodo: { desde: string; hasta: string }) {
    const [balance] = await query<{ data: unknown }>(
      `SELECT generar_balance_general($1, $2) as data`,
      [periodo.desde, periodo.hasta]
    );
    const [resultado] = await query<{ data: unknown }>(
      `SELECT generar_estado_resultados($1, $2) as data`,
      [periodo.desde, periodo.hasta]
    );
    const [flujo] = await query<{ data: unknown }>(
      `SELECT generar_flujo_efectivo($1, $2) as data`,
      [periodo.desde, periodo.hasta]
    );

    return {
      balanceGeneral: balance.data,
      estadoResultados: resultado.data,
      flujoEfectivo: flujo.data
    };
  }
}
