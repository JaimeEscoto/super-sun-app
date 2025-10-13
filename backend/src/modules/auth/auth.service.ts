import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { env } from '../../config/env.js';
import { query } from '../../db/index.js';
import { ApplicationError } from '../common/errors.js';
import { permissions } from '../common/permissions.js';
import { Role } from '../common/types.js';

interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  active: boolean;
}

export class AuthService {
  async login(email: string, password: string) {
    const [user] = await query<UserRecord>(
      `SELECT id, email, password_hash, role, active FROM users WHERE email = $1`,
      [email]
    );

    if (!user || !user.active) {
      throw new ApplicationError('Credenciales inválidas', 401);
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new ApplicationError('Credenciales inválidas', 401);
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: permissions[user.role]
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: permissions[user.role]
      }
    };
  }
}
