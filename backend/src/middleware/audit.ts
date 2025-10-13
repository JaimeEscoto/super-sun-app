import { NextFunction, Request, Response } from 'express';

import { AuditContext } from '../modules/common/types.js';
import { logger } from '../utils/logger.js';

export const auditTrail = (action: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const context: AuditContext = {
      action,
      actor: (req as Request & { user?: AuditContext['actor'] }).user ?? {
        id: 'anon',
        role: 'anon',
        permissions: []
      },
      timestamp: new Date().toISOString(),
      metadata: {
        method: req.method,
        path: req.path,
        body: req.body,
        params: req.params,
        query: req.query
      }
    };

    logger.info(`AUDIT:${JSON.stringify(context)}`);
    next();
  };
};
