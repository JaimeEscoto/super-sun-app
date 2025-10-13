export type Role =
  | 'ADMINISTRADOR'
  | 'CONTADOR'
  | 'VENTAS'
  | 'COMPRAS'
  | 'ALMACEN'
  | 'AUDITOR';

export interface PermissionMatrix {
  [role: string]: string[];
}

export interface AuditContext {
  action: string;
  actor: {
    id: string;
    role: Role | string;
    permissions: string[];
  };
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}
