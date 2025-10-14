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

const quickPurchaseOrderSchema = Joi.object({
  proveedor_id: Joi.string().uuid().optional(),
  proveedor_nombre: Joi.string().allow('', null).default('Proveedor acciones rápidas'),
  proveedor_rtn: Joi.string().allow('', null),
  fecha: Joi.date().iso().required(),
  moneda: Joi.string().required(),
  estado: Joi.string().default('BORRADOR'),
  total: Joi.number().min(0).required(),
  condiciones_pago: Joi.string().allow('', null),
  referencia: Joi.string().allow('', null)
});

purchasingRouter.post(
  '/ordenes',
  authorize('compras:gestionar'),
  auditTrail('compras.ordenes.crear'),
  async (req: Request, res: Response) => {
    const { error, value } = Joi.alternatives()
      .try(purchaseOrderSchema, quickPurchaseOrderSchema)
      .validate(req.body, { abortEarly: false, stripUnknown: true });

    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    if ('proveedorId' in value) {
      const [orden] = await service.createPurchaseOrder(value);
      return res.status(201).json({ orden });
    }

    const orden = await service.createQuickPurchaseOrder({
      proveedorId: value.proveedor_id,
      proveedorNombre: value.proveedor_nombre || 'Proveedor acciones rápidas',
      proveedorRtn: value.proveedor_rtn || undefined,
      fecha: value.fecha,
      moneda: value.moneda,
      estado: value.estado,
      condicionesPago: value.condiciones_pago || undefined,
      total: value.total,
      referencia: value.referencia || undefined
    });

    res.status(201).json({ orden });
  }
);
