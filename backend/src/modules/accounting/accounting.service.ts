import { query, queryWithClient, withTransaction } from '../../db/index.js';

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

  async createJournalEntry(payload: {
    fecha: string;
    diario: string;
    descripcion?: string;
    lineas: Array<{
      cuentaId: string;
      centroCostoId?: string | null;
      debe: number;
      haber: number;
      docRef?: string | null;
    }>;
    usuarioId?: string;
  }) {
    const totalDebe = payload.lineas.reduce((acc, linea) => acc + linea.debe, 0);
    const totalHaber = payload.lineas.reduce((acc, linea) => acc + linea.haber, 0);

    return withTransaction(async (client) => {
      const [asiento] = await queryWithClient<{
        id: string;
        fecha: string;
        diario: string;
        descripcion: string | null;
        total_debe: string;
        total_haber: string;
      }>(
        client,
        `INSERT INTO asientos (fecha, diario, descripcion, total_debe, total_haber, created_by)
         VALUES ($1::date, $2, $3, $4, $5, $6)
         RETURNING asiento_id as id, fecha, diario, descripcion, total_debe, total_haber`,
        [payload.fecha, payload.diario, payload.descripcion ?? null, totalDebe, totalHaber, payload.usuarioId ?? null]
      );

      for (const linea of payload.lineas) {
        await queryWithClient(
          client,
          `INSERT INTO asientos_detalle (asiento_id, cuenta_id, centro_costo_id, debe, haber, doc_ref)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            asiento.id,
            linea.cuentaId,
            linea.centroCostoId ?? null,
            linea.debe,
            linea.haber,
            linea.docRef ?? null
          ]
        );
      }

      const [transaccion] = await queryWithClient<{ transaccion_id: string }>(
        client,
        `INSERT INTO transacciones (tipo, referencia_id, descripcion, datos, created_by)
         VALUES ('ASIENTO_CONTABLE', $1, $2, $3::jsonb, $4)
         RETURNING transaccion_id`,
        [
          asiento.id,
          `Asiento ${asiento.diario} del ${asiento.fecha}`,
          JSON.stringify({
            asiento,
            lineas: payload.lineas
          }),
          payload.usuarioId ?? null
        ]
      );

      return {
        asiento,
        transaccionId: transaccion.transaccion_id
      };
    });
  }
}
