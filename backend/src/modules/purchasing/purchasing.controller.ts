import { Request, Response, Router } from 'express';
import Joi from 'joi';

import { authorize } from '../../middleware/auth.js';
import { auditTrail } from '../../middleware/audit.js';
import { PurchasingService } from './purchasing.service.js';

const service = new PurchasingService();
export const purchasingRouter = Router();

purchasingRouter.get(
  '/ordenes',
  authorize('compras:gestionar'),
  auditTrail('compras.ordenes.listar'),
  async (req: Request, res: Response) => {
    const status = req.query.estado as string | undefined;
    const data = await service.listPurchaseOrders(status);
    res.json({ data });
  }
);

const lineSchema = Joi.object({
  productoId: Joi.string().uuid().required(),
  cantidad: Joi.number().positive().required(),
  precio: Joi.number().positive().required(),
  impuestos: Joi.array().items(Joi.number()).default([])
});

const purchaseOrderSchema = Joi.object({
  proveedorId: Joi.string().uuid().required(),
  fecha: Joi.date().iso().required(),
  moneda: Joi.string().required(),
  condicionesPago: Joi.string().required(),
  solicitanteId: Joi.string().uuid().required(),
  lineas: Joi.array().items(lineSchema).min(1).required()
});

purchasingRouter.post(
  '/ordenes',
  authorize('compras:gestionar'),
  auditTrail('compras.ordenes.crear'),
  async (req: Request, res: Response) => {
    const { error, value } = purchaseOrderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const [orden] = await service.createPurchaseOrder(value);
    res.status(201).json({ orden });
  }
);
