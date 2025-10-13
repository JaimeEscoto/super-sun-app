import { Request, Response, Router } from 'express';
import Joi from 'joi';

import { authorize } from '../../middleware/auth.js';
import { auditTrail } from '../../middleware/audit.js';
import { SalesService } from './sales.service.js';

const service = new SalesService();
export const salesRouter = Router();

salesRouter.get(
  '/pedidos',
  authorize('ventas:gestionar'),
  auditTrail('ventas.pedidos.listar'),
  async (req: Request, res: Response) => {
    const status = req.query.estado as string | undefined;
    const data = await service.listOrders(status);
    res.json({ data });
  }
);

const lineSchema = Joi.object({
  productoId: Joi.string().uuid().required(),
  cantidad: Joi.number().positive().required(),
  precio: Joi.number().positive().required(),
  descuentos: Joi.number().min(0).default(0)
});

const orderSchema = Joi.object({
  clienteId: Joi.string().uuid().required(),
  fecha: Joi.date().iso().required(),
  moneda: Joi.string().required(),
  vendedorId: Joi.string().uuid().required(),
  condicionesPago: Joi.string().required(),
  lineas: Joi.array().items(lineSchema).min(1).required()
});

salesRouter.post(
  '/pedidos',
  authorize('ventas:gestionar'),
  auditTrail('ventas.pedidos.crear'),
  async (req: Request, res: Response) => {
    const { error, value } = orderSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const [pedido] = await service.createOrder(value);
    res.status(201).json({ pedido });
  }
);
