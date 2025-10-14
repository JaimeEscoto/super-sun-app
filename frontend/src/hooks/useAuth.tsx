import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react';

import api from '@/lib/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export const DEMO_CREDENTIALS: LoginPayload = {
  email: 'demo@solarishn.com',
  password: 'Honduras2024!'
};

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? (JSON.parse(stored) as User) : null;
  });

  const persistSession = useCallback((token: string, nextUser: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      const { data } = await api.post<{ token: string; user: User }>('/auth/login', payload);
      persistSession(data.token, data.user);
      return data.user;
    } catch (error) {
      const isDemoCredentials =
        payload.email === DEMO_CREDENTIALS.email && payload.password === DEMO_CREDENTIALS.password;

      if (!isDemoCredentials) {
        throw new Error('Credenciales inválidas, intenta de nuevo.');
      }

      const demoUser: User = {
        id: 'demo-hn',
        email: DEMO_CREDENTIALS.email,
        role: 'ADMINISTRADOR',
        permissions: [
          'compras.crear',
          'ventas.crear',
          'inventario.crear',
          'facturacion.crear',
          'contabilidad.crear',
          'reportes:ver'
        ]
      };

      persistSession('demo-token-hn', demoUser);
      return demoUser;
    }
  }, [persistSession]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login,
      logout
    }),
    [login, logout, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }

  return context;
};
