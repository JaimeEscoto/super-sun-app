import { Request, Response, Router } from 'express';
import Joi from 'joi';

import { AuthenticatedRequest, authorize } from '../../middleware/auth.js';
import { auditTrail } from '../../middleware/audit.js';
import { UnauthorizedError } from '../common/errors.js';
import { getValidUuid } from '../../utils/uuid.js';
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

const journalEntryLineSchema = Joi.object({
  cuentaId: Joi.string().required(),
  centroCostoId: Joi.string().allow('', null),
  debe: Joi.number().min(0).default(0),
  haber: Joi.number().min(0).default(0),
  docRef: Joi.string().allow('', null)
}).custom((value, helpers) => {
  const debe = Number(value.debe ?? 0);
  const haber = Number(value.haber ?? 0);

  if (debe === 0 && haber === 0) {
    return helpers.error('any.invalid', { message: 'Cada línea debe tener monto en debe o haber.' });
  }

  if (debe > 0 && haber > 0) {
    return helpers.error('any.invalid', { message: 'Debe y haber no pueden tener valores simultáneamente.' });
  }

  return value;
});

const journalEntrySchema = Joi.object({
  fecha: Joi.date().iso().required(),
  diario: Joi.string().required(),
  descripcion: Joi.string().allow('', null),
  lineas: Joi.array().items(journalEntryLineSchema).min(2).required()
}).custom((value, helpers) => {
  const totalDebe = value.lineas.reduce((acc: number, linea: any) => acc + Number(linea.debe ?? 0), 0);
  const totalHaber = value.lineas.reduce((acc: number, linea: any) => acc + Number(linea.haber ?? 0), 0);

  if (Number(totalDebe.toFixed(2)) !== Number(totalHaber.toFixed(2))) {
    return helpers.error('any.invalid', {
      message: 'El asiento debe estar balanceado: el total debe coincidir con el total haber.'
    });
  }

  return value;
});

accountingRouter.post(
  '/asientos',
  authorize('contabilidad:libros'),
  auditTrail('contabilidad.asientos.crear'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { error, value } = journalEntrySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const usuarioId = getValidUuid(req.user.id);
    const asiento = await service.createJournalEntry({
      fecha: value.fecha,
      diario: value.diario,
      descripcion: value.descripcion ?? undefined,
      lineas: value.lineas.map((linea: any) => ({
        cuentaId: linea.cuentaId,
        centroCostoId: linea.centroCostoId || null,
        debe: Number(linea.debe ?? 0),
        haber: Number(linea.haber ?? 0),
        docRef: linea.docRef || null
      })),
      usuarioId
    });

    res.status(201).json({ asiento });
  }
);
