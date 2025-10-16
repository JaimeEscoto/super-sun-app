import { Response, Router } from 'express';
import Joi from 'joi';

import { AuthenticatedRequest, authorize } from '../../middleware/auth.js';
import { auditTrail } from '../../middleware/audit.js';
import { UnauthorizedError } from '../common/errors.js';
import { getValidUuid } from '../../utils/uuid.js';
import { InventoryService } from './inventory.service.js';

const service = new InventoryService();
export const inventoryRouter = Router();

inventoryRouter.get(
  '/kardex/:productoId',
  authorize('inventario:ver'),
  auditTrail('inventario.kardex.consultar'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { productoId } = req.params;
    const almacenId = req.query.almacenId as string | undefined;
    const data = await service.getKardex(productoId, almacenId);
    res.json({ data });
  }
);

inventoryRouter.get(
  '/valuacion',
  authorize('inventario:ver'),
  auditTrail('inventario.valuacion.listar'),
  async (_req: AuthenticatedRequest, res: Response) => {
    const data = await service.getValuation();
    res.json({ data });
  }
);

const adjustmentSchema = Joi.object({
  productoId: Joi.string().uuid().required(),
  almacenId: Joi.string().uuid().required(),
  cantidad: Joi.number().required(),
  motivo: Joi.string().required(),
  costoUnitario: Joi.number().optional()
});

inventoryRouter.post(
  '/ajustes',
  authorize('inventario:movimientos'),
  auditTrail('inventario.ajustes.crear'),
  async (req: AuthenticatedRequest, res: Response) => {
    const { error, value } = adjustmentSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const usuarioId = getValidUuid(req.user.id);
    const [ajuste] = await service.createAdjustment({ ...value, usuarioId });
    res.status(201).json({ ajuste });
  }
);
