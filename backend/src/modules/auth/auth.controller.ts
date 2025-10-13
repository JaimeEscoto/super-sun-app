import { Request, Response, Router } from 'express';
import Joi from 'joi';

import { auditTrail } from '../../middleware/audit.js';
import { AuthService } from './auth.service.js';

const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required()
});

export const authRouter = Router();
const service = new AuthService();

authRouter.post('/login', auditTrail('auth.login'), async (req: Request, res: Response) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ message: 'Datos inválidos', details: error.details });
  }

  const result = await service.login(value.email, value.password);
  return res.json(result);
});
