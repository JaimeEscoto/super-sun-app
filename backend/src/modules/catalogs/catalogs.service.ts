import { query } from '../../db/index.js';
import { PaginatedResult } from '../common/types.js';

interface ClientRow {
  id: string;
  codigo: string;
  razonSocial: string;
  nif: string;
  limiteCredito: number;
  saldo: number;
  estado: string;
}

interface SupplierRow {
  id: string;
  nombre: string;
  nif: string;
  saldo: number;
  condPagoId: string | null;
}

interface ProductRow {
  id: string;
  sku: string;
  descripcion: string;
  uom: string;
  precioBase: number;
  activo: boolean;
}

interface WarehouseRow {
  id: string;
  codigo: string;
  nombre: string;
  direccion: Record<string, unknown> | null;
}

interface PaymentTermRow {
  id: string;
  nombre: string;
  dias: number;
}

interface PriceListRow {
  id: string;
  nombre: string;
  moneda: string;
  activa: boolean;
}

interface TaxTypeRow {
  id: string;
  nombre: string;
  tasa: number;
  tipo: string;
  aplicacion: string;
}

interface LocationRow {
  id: string;
  almacenId: string;
  almacenNombre: string;
  codigo: string;
  descripcion: string | null;
}

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
    return paginate<ClientRow>(
      `SELECT
        cliente_id as "id",
        codigo,
        razon_social as "razonSocial",
        nif,
        limite_credito as "limiteCredito",
        saldo,
        estado
      FROM clientes
      ORDER BY razon_social`,
      [],
      page,
      pageSize
    );
  }

  async createClient(input: {
    codigo: string;
    razonSocial: string;
    nif: string;
    limiteCredito?: number;
    saldo?: number;
    estado?: string;
  }) {
    const [cliente] = await query<ClientRow>(
      `INSERT INTO clientes (codigo, razon_social, nif, limite_credito, saldo, estado)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
        cliente_id as "id",
        codigo,
        razon_social as "razonSocial",
        nif,
        limite_credito as "limiteCredito",
        saldo,
        estado`,
      [
        input.codigo,
        input.razonSocial,
        input.nif,
        input.limiteCredito ?? 0,
        input.saldo ?? 0,
        input.estado ?? 'ACTIVO'
      ]
    );
    return cliente;
  }

  async updateClient(
    id: string,
    input: {
      codigo: string;
      razonSocial: string;
      nif: string;
      limiteCredito?: number;
      saldo?: number;
      estado?: string;
    }
  ) {
    const updated = await query<ClientRow>(
      `UPDATE clientes
       SET codigo = $1,
           razon_social = $2,
           nif = $3,
           limite_credito = $4,
           saldo = $5,
           estado = $6,
           updated_at = now()
       WHERE cliente_id = $7
       RETURNING
        cliente_id as "id",
        codigo,
        razon_social as "razonSocial",
        nif,
        limite_credito as "limiteCredito",
        saldo,
        estado`,
      [
        input.codigo,
        input.razonSocial,
        input.nif,
        input.limiteCredito ?? 0,
        input.saldo ?? 0,
        input.estado ?? 'ACTIVO',
        id
      ]
    );
    return updated[0] ?? null;
  }

  async deleteClient(id: string) {
    const deleted = await query<{ id: string }>(
      `DELETE FROM clientes WHERE cliente_id = $1 RETURNING cliente_id as id`,
      [id]
    );
    return deleted[0] ?? null;
  }

  getSuppliers(page = 1, pageSize = 25) {
    return paginate<SupplierRow>(
      `SELECT
        proveedor_id as "id",
        nombre,
        nif,
        saldo,
        cond_pago_id as "condPagoId"
      FROM proveedores
      ORDER BY nombre`,
      [],
      page,
      pageSize
    );
  }

  async createSupplier(input: {
    nombre: string;
    nif: string;
    saldo?: number;
    condPagoId?: string | null;
  }) {
    const [proveedor] = await query<SupplierRow>(
      `INSERT INTO proveedores (nombre, nif, saldo, cond_pago_id)
       VALUES ($1, $2, $3, $4)
       RETURNING
        proveedor_id as "id",
        nombre,
        nif,
        saldo,
        cond_pago_id as "condPagoId"`,
      [input.nombre, input.nif, input.saldo ?? 0, input.condPagoId ?? null]
    );
    return proveedor;
  }

  async updateSupplier(
    id: string,
    input: { nombre: string; nif: string; saldo?: number; condPagoId?: string | null }
  ) {
    const updated = await query<SupplierRow>(
      `UPDATE proveedores
       SET nombre = $1,
           nif = $2,
           saldo = $3,
           cond_pago_id = $4,
           updated_at = now()
       WHERE proveedor_id = $5
       RETURNING
        proveedor_id as "id",
        nombre,
        nif,
        saldo,
        cond_pago_id as "condPagoId"`,
      [input.nombre, input.nif, input.saldo ?? 0, input.condPagoId ?? null, id]
    );
    return updated[0] ?? null;
  }

  async deleteSupplier(id: string) {
    const deleted = await query<{ id: string }>(
      `DELETE FROM proveedores WHERE proveedor_id = $1 RETURNING proveedor_id as id`,
      [id]
    );
    return deleted[0] ?? null;
  }

  getProducts(page = 1, pageSize = 25) {
    return paginate<ProductRow>(
      `SELECT
        producto_id as "id",
        sku,
        descripcion,
        uom,
        precio_base as "precioBase",
        activo
      FROM productos
      ORDER BY descripcion`,
      [],
      page,
      pageSize
    );
  }

  async createProduct(input: {
    sku: string;
    descripcion: string;
    uom: string;
    precioBase?: number;
    activo?: boolean;
  }) {
    const [producto] = await query<ProductRow>(
      `INSERT INTO productos (sku, descripcion, uom, precio_base, activo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING
        producto_id as "id",
        sku,
        descripcion,
        uom,
        precio_base as "precioBase",
        activo`,
      [input.sku, input.descripcion, input.uom, input.precioBase ?? 0, input.activo ?? true]
    );
    return producto;
  }

  async updateProduct(
    id: string,
    input: { sku: string; descripcion: string; uom: string; precioBase?: number; activo?: boolean }
  ) {
    const updated = await query<ProductRow>(
      `UPDATE productos
       SET sku = $1,
           descripcion = $2,
           uom = $3,
           precio_base = $4,
           activo = $5,
           updated_at = now()
       WHERE producto_id = $6
       RETURNING
        producto_id as "id",
        sku,
        descripcion,
        uom,
        precio_base as "precioBase",
        activo`,
      [input.sku, input.descripcion, input.uom, input.precioBase ?? 0, input.activo ?? true, id]
    );
    return updated[0] ?? null;
  }

  async deleteProduct(id: string) {
    const deleted = await query<{ id: string }>(
      `DELETE FROM productos WHERE producto_id = $1 RETURNING producto_id as id`,
      [id]
    );
    return deleted[0] ?? null;
  }

  async getWarehouses() {
    return query<WarehouseRow>(
      `SELECT
        almacen_id as "id",
        codigo,
        nombre,
        direccion
      FROM almacenes
      ORDER BY nombre`
    );
  }

  async createWarehouse(input: { codigo: string; nombre: string; direccion?: Record<string, unknown> | null }) {
    const [almacen] = await query<WarehouseRow>(
      `INSERT INTO almacenes (codigo, nombre, direccion)
       VALUES ($1, $2, $3)
       RETURNING
        almacen_id as "id",
        codigo,
        nombre,
        direccion`,
      [input.codigo, input.nombre, input.direccion ?? null]
    );
    return almacen;
  }

  async updateWarehouse(
    id: string,
    input: { codigo: string; nombre: string; direccion?: Record<string, unknown> | null }
  ) {
    const updated = await query<WarehouseRow>(
      `UPDATE almacenes
       SET codigo = $1,
           nombre = $2,
           direccion = $3,
           updated_at = now()
       WHERE almacen_id = $4
       RETURNING
        almacen_id as "id",
        codigo,
        nombre,
        direccion`,
      [input.codigo, input.nombre, input.direccion ?? null, id]
    );
    return updated[0] ?? null;
  }

  async deleteWarehouse(id: string) {
    const deleted = await query<{ id: string }>(
      `DELETE FROM almacenes WHERE almacen_id = $1 RETURNING almacen_id as id`,
      [id]
    );
    return deleted[0] ?? null;
  }

  async getPaymentTerms() {
    return query<PaymentTermRow>(
      `SELECT cond_pago_id as "id", nombre, dias FROM condiciones_pago ORDER BY nombre`
    );
  }

  async createPaymentTerm(input: { nombre: string; dias: number }) {
    const [term] = await query<PaymentTermRow>(
      `INSERT INTO condiciones_pago (nombre, dias)
       VALUES ($1, $2)
       RETURNING cond_pago_id as "id", nombre, dias`,
      [input.nombre, input.dias]
    );
    return term;
  }

  async updatePaymentTerm(id: string, input: { nombre: string; dias: number }) {
    const updated = await query<PaymentTermRow>(
      `UPDATE condiciones_pago
       SET nombre = $1,
           dias = $2
       WHERE cond_pago_id = $3
       RETURNING cond_pago_id as "id", nombre, dias`,
      [input.nombre, input.dias, id]
    );
    return updated[0] ?? null;
  }

  async deletePaymentTerm(id: string) {
    const deleted = await query<{ id: string }>(
      `DELETE FROM condiciones_pago WHERE cond_pago_id = $1 RETURNING cond_pago_id as id`,
      [id]
    );
    return deleted[0] ?? null;
  }

  async getPriceLists() {
    return query<PriceListRow>(
      `SELECT lista_precio_id as "id", nombre, moneda, activa FROM listas_precio ORDER BY nombre`
    );
  }

  async createPriceList(input: { nombre: string; moneda: string; activa: boolean }) {
    const [lista] = await query<PriceListRow>(
      `INSERT INTO listas_precio (nombre, moneda, activa)
       VALUES ($1, $2, $3)
       RETURNING lista_precio_id as "id", nombre, moneda, activa`,
      [input.nombre, input.moneda, input.activa]
    );
    return lista;
  }

  async updatePriceList(id: string, input: { nombre: string; moneda: string; activa: boolean }) {
    const updated = await query<PriceListRow>(
      `UPDATE listas_precio
       SET nombre = $1,
           moneda = $2,
           activa = $3
       WHERE lista_precio_id = $4
       RETURNING lista_precio_id as "id", nombre, moneda, activa`,
      [input.nombre, input.moneda, input.activa, id]
    );
    return updated[0] ?? null;
  }

  async deletePriceList(id: string) {
    const deleted = await query<{ id: string }>(
      `DELETE FROM listas_precio WHERE lista_precio_id = $1 RETURNING lista_precio_id as id`,
      [id]
    );
    return deleted[0] ?? null;
  }

  async getTaxTypes() {
    return query<TaxTypeRow>(
      `SELECT tipo_impuesto_id as "id", nombre, tasa, tipo, aplicacion FROM tipos_impuesto ORDER BY nombre`
    );
  }

  async createTaxType(input: { nombre: string; tasa: number; tipo: string; aplicacion: string }) {
    const [tipo] = await query<TaxTypeRow>(
      `INSERT INTO tipos_impuesto (nombre, tasa, tipo, aplicacion)
       VALUES ($1, $2, $3, $4)
       RETURNING tipo_impuesto_id as "id", nombre, tasa, tipo, aplicacion`,
      [input.nombre, input.tasa, input.tipo, input.aplicacion]
    );
    return tipo;
  }

  async updateTaxType(id: string, input: { nombre: string; tasa: number; tipo: string; aplicacion: string }) {
    const updated = await query<TaxTypeRow>(
      `UPDATE tipos_impuesto
       SET nombre = $1,
           tasa = $2,
           tipo = $3,
           aplicacion = $4
       WHERE tipo_impuesto_id = $5
       RETURNING tipo_impuesto_id as "id", nombre, tasa, tipo, aplicacion`,
      [input.nombre, input.tasa, input.tipo, input.aplicacion, id]
    );
    return updated[0] ?? null;
  }

  async deleteTaxType(id: string) {
    const deleted = await query<{ id: string }>(
      `DELETE FROM tipos_impuesto WHERE tipo_impuesto_id = $1 RETURNING tipo_impuesto_id as id`,
      [id]
    );
    return deleted[0] ?? null;
  }

  async getLocations() {
    return query<LocationRow>(
      `SELECT
        u.ubicacion_id as "id",
        u.almacen_id as "almacenId",
        a.nombre as "almacenNombre",
        u.codigo,
        u.descripcion
      FROM ubicaciones u
      JOIN almacenes a ON a.almacen_id = u.almacen_id
      ORDER BY a.nombre, u.codigo`
    );
  }

  async createLocation(input: { almacenId: string; codigo: string; descripcion?: string | null }) {
    const [ubicacion] = await query<LocationRow>(
      `INSERT INTO ubicaciones (almacen_id, codigo, descripcion)
       VALUES ($1, $2, $3)
       RETURNING
        ubicacion_id as "id",
        almacen_id as "almacenId",
        (SELECT nombre FROM almacenes WHERE almacen_id = $1) as "almacenNombre",
        codigo,
        descripcion`,
      [input.almacenId, input.codigo, input.descripcion ?? null]
    );
    return ubicacion;
  }

  async updateLocation(
    id: string,
    input: { almacenId: string; codigo: string; descripcion?: string | null }
  ) {
    const updated = await query<LocationRow>(
      `UPDATE ubicaciones
       SET almacen_id = $1,
           codigo = $2,
           descripcion = $3
       WHERE ubicacion_id = $4
       RETURNING
        ubicacion_id as "id",
        almacen_id as "almacenId",
        (SELECT nombre FROM almacenes WHERE almacen_id = $1) as "almacenNombre",
        codigo,
        descripcion`,
      [input.almacenId, input.codigo, input.descripcion ?? null, id]
    );
    return updated[0] ?? null;
  }

  async deleteLocation(id: string) {
    const deleted = await query<{ id: string }>(
      `DELETE FROM ubicaciones WHERE ubicacion_id = $1 RETURNING ubicacion_id as id`,
      [id]
    );
    return deleted[0] ?? null;
  }
}
