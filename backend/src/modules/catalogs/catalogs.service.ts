import { query } from '../../db/index.js';
import { PaginatedResult } from '../common/types.js';

const paginate = async <T>(sql: string, params: unknown[], page: number, pageSize: number) => {
  const offset = (page - 1) * pageSize;
  const data = await query<T>(`${sql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [
    ...params,
    pageSize,
    offset
  ]);
  const totalRows = await query<{ count: string }>(`SELECT COUNT(*) as count FROM (${sql}) q`, params);
  const total = Number(totalRows[0].count);
  return {
    data,
    pagination: {
      total,
      page,
      pageSize
    }
  } satisfies PaginatedResult<T>;
};

export class CatalogsService {
  getClients(page = 1, pageSize = 25) {
    return paginate<unknown>(
      `SELECT cliente_id as id, codigo, razon_social, nif, limite_credito, saldo, estado FROM clientes ORDER BY razon_social`,
      [],
      page,
      pageSize
    );
  }

  getSuppliers(page = 1, pageSize = 25) {
    return paginate<unknown>(
      `SELECT proveedor_id as id, nombre, nif, saldo, condiciones_pago FROM proveedores ORDER BY nombre`,
      [],
      page,
      pageSize
    );
  }

  getProducts(page = 1, pageSize = 25) {
    return paginate<unknown>(
      `SELECT producto_id as id, sku, descripcion, uom, precio_base, activo FROM productos ORDER BY descripcion`,
      [],
      page,
      pageSize
    );
  }

  getWarehouses() {
    return query(
      `SELECT almacen_id as id, nombre, codigo, direccion FROM almacenes ORDER BY nombre`
    );
  }
}
