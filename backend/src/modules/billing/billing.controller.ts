import { Request, Response, Router } from 'express';
import Joi from 'joi';

import { authorize } from '../../middleware/auth.js';
import { auditTrail } from '../../middleware/audit.js';
import { BillingService } from './billing.service.js';

const service = new BillingService();
export const billingRouter = Router();

billingRouter.get(
  '/facturas',
  authorize('facturacion:emitir'),
  auditTrail('facturacion.facturas.listar'),
  async (req: Request, res: Response) => {
    const clienteId = req.query.clienteId as string | undefined;
    const estado = req.query.estado as string | undefined;
    const data = await service.listInvoices({ clienteId, estado });
    res.json({ data });
  }
);

const taxSchema = Joi.object({
  tipoImpuestoId: Joi.string().uuid().required(),
  tasa: Joi.number().min(0).required()
});

const lineSchema = Joi.object({
  descripcion: Joi.string().required(),
  cantidad: Joi.number().positive().required(),
  precioUnitario: Joi.number().positive().required(),
  impuestos: Joi.array().items(taxSchema).default([])
});

const invoiceSchema = Joi.object({
  pedidoId: Joi.string().uuid().required(),
  fechaEmision: Joi.date().iso().required(),
  moneda: Joi.string().required(),
  tipoComprobante: Joi.string().valid('FACTURA', 'BOLETA', 'TICKET', 'PROFORMA').required(),
  lineas: Joi.array().items(lineSchema).min(1).required()
});

billingRouter.post(
  '/facturas',
  authorize('facturacion:emitir'),
  auditTrail('facturacion.facturas.crear'),
  async (req: Request, res: Response) => {
    const { error, value } = invoiceSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const [factura] = await service.createInvoice(value);
    res.status(201).json({ factura });
  }
);
