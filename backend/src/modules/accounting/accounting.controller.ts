import { Request, Response, Router } from 'express';
import Joi from 'joi';

import { authorize } from '../../middleware/auth.js';
import { auditTrail } from '../../middleware/audit.js';
import { AccountingService } from './accounting.service.js';

const service = new AccountingService();
export const accountingRouter = Router();

accountingRouter.get(
  '/asientos',
  authorize('contabilidad:libros'),
  auditTrail('contabilidad.asientos.listar'),
  async (req: Request, res: Response) => {
    const desde = req.query.desde as string | undefined;
    const hasta = req.query.hasta as string | undefined;
    const data = await service.listJournalEntries({ desde, hasta });
    res.json({ data });
  }
);

const trialBalanceSchema = Joi.object({
  fecha: Joi.date().iso().required()
});

accountingRouter.get(
  '/balanza',
  authorize('contabilidad:libros'),
  auditTrail('contabilidad.balanza.consultar'),
  async (req: Request, res: Response) => {
    const { error, value } = trialBalanceSchema.validate(req.query, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const data = await service.getTrialBalance(value.fecha as string);
    res.json({ data });
  }
);

const financialStatementsSchema = Joi.object({
  desde: Joi.date().iso().required(),
  hasta: Joi.date().iso().required()
});

accountingRouter.get(
  '/estados-financieros',
  authorize('contabilidad:libros'),
  auditTrail('contabilidad.estados-financieros.consultar'),
  async (req: Request, res: Response) => {
    const { error, value } = financialStatementsSchema.validate(req.query, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const data = await service.getFinancialStatements({
      desde: value.desde as string,
      hasta: value.hasta as string
    });
    res.json(data);
  }
);
