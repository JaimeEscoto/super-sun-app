import { Router } from 'express';

import { authenticate } from '../middleware/auth.js';
import { auditTrail } from '../middleware/audit.js';
import { accountingRouter } from '../modules/accounting/accounting.controller.js';
import { authRouter } from '../modules/auth/auth.controller.js';
import { billingRouter } from '../modules/billing/billing.controller.js';
import { catalogsRouter } from '../modules/catalogs/catalogs.controller.js';
import { inventoryRouter } from '../modules/inventory/inventory.controller.js';
import { purchasingRouter } from '../modules/purchasing/purchasing.controller.js';
import { reportsRouter } from '../modules/common/reports.controller.js';
import { salesRouter } from '../modules/sales/sales.controller.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/health', auditTrail('system.health'), (_req, res) => res.json({ status: 'ok' }));

apiRouter.use(authenticate);
apiRouter.use('/catalogos', catalogsRouter);
apiRouter.use('/inventario', inventoryRouter);
apiRouter.use('/compras', purchasingRouter);
apiRouter.use('/ventas', salesRouter);
apiRouter.use('/facturacion', billingRouter);
apiRouter.use('/contabilidad', accountingRouter);
apiRouter.use('/reportes', reportsRouter);
