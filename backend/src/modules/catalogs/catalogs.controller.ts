import { Request, Response, Router } from 'express';

import { authorize } from '../../middleware/auth.js';
import { auditTrail } from '../../middleware/audit.js';
import { CatalogsService } from './catalogs.service.js';

const service = new CatalogsService();
export const catalogsRouter = Router();

catalogsRouter.get(
  '/clientes',
  authorize('catalogos:ver'),
  auditTrail('catalogos.clientes.listar'),
  async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 25);
    const result = await service.getClients(page, pageSize);
    res.json(result);
  }
);

catalogsRouter.get(
  '/proveedores',
  authorize('catalogos:ver'),
  auditTrail('catalogos.proveedores.listar'),
  async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 25);
    const result = await service.getSuppliers(page, pageSize);
    res.json(result);
  }
);

catalogsRouter.get(
  '/productos',
  authorize('catalogos:ver'),
  auditTrail('catalogos.productos.listar'),
  async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 25);
    const result = await service.getProducts(page, pageSize);
    res.json(result);
  }
);

catalogsRouter.get(
  '/almacenes',
  authorize('catalogos:ver'),
  auditTrail('catalogos.almacenes.listar'),
  async (_req: Request, res: Response) => {
    const result = await service.getWarehouses();
    res.json({ data: result });
  }
);
