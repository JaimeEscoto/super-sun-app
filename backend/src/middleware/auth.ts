import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { ForbiddenError, UnauthorizedError } from '../modules/common/errors.js';
import { AuditContext } from '../modules/common/types.js';

export interface AuthenticatedRequest extends Request {
  user?: AuditContext['actor'];
}

export const authenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header) {
    throw new UnauthorizedError('Token no provisto');
  }

  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) {
    throw new UnauthorizedError('Formato de token inválido');
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuditContext['actor'];
    req.user = payload;
    next();
  } catch {
    throw new UnauthorizedError('Token inválido o expirado');
  }
};

export const authorize = (permission: string) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    if (!req.user.permissions.includes(permission)) {
      throw new ForbiddenError('No cuenta con permisos para esta acción');
    }

    next();
  };
};
