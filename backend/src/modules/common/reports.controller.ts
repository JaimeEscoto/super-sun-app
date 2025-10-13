import { Request, Response, Router } from 'express';

import { authorize } from '../../middleware/auth.js';
import { auditTrail } from '../../middleware/audit.js';
import { ReportsService } from './reports.service.js';

const service = new ReportsService();
export const reportsRouter = Router();

reportsRouter.get(
  '/ventas',
  authorize('reportes:ver'),
  auditTrail('reportes.ventas'),
  async (req: Request, res: Response) => {
    const desde = req.query.desde as string | undefined;
    const hasta = req.query.hasta as string | undefined;
    const data = await service.salesByCustomer({ desde, hasta });
    res.json({ data });
  }
);

reportsRouter.get(
  '/inventario',
  authorize('reportes:ver'),
  auditTrail('reportes.inventario'),
  async (_req: Request, res: Response) => {
    const data = await service.inventoryAging();
    res.json({ data });
  }
);

reportsRouter.get(
  '/cartera',
  authorize('reportes:ver'),
  auditTrail('reportes.cartera'),
  async (_req: Request, res: Response) => {
    const data = await service.receivablesPayablesAging();
    res.json(data);
  }
);
