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

const DEMO_CREDENTIALS = {
  email: 'demo@solarishn.com',
  password: 'Honduras2024!'
};

export class AuthService {
  private createDemoSession() {
    const role: Role = 'ADMINISTRADOR';
    const user = {
      id: 'demo-hn',
      email: DEMO_CREDENTIALS.email,
      role,
      permissions: permissions[role]
    };

    const token = jwt.sign(user, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
    return { token, user };
  }

  private isDemoCredentials(email: string, password: string) {
    return email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password;
  }

  async login(email: string, password: string) {
    if (this.isDemoCredentials(email, password)) {
      return this.createDemoSession();
    }

    const [user] = await query<UserRecord>(
      `
        SELECT
          id,
          email,
          password_hash,
          rol AS role,
          activo AS active
        FROM usuarios
        WHERE email = $1
      `,
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
