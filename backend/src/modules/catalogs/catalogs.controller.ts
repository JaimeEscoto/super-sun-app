import { Request, Response, Router } from 'express';
import Joi from 'joi';

import { authorize } from '../../middleware/auth.js';
import { auditTrail } from '../../middleware/audit.js';
import { CatalogsService } from './catalogs.service.js';

const service = new CatalogsService();
export const catalogsRouter = Router();

const clientSchema = Joi.object({
  codigo: Joi.string().max(50).required(),
  razonSocial: Joi.string().max(255).required(),
  nif: Joi.string().max(50).required(),
  limiteCredito: Joi.number().min(0).default(0),
  saldo: Joi.number().min(0).default(0),
  estado: Joi.string().valid('ACTIVO', 'INACTIVO').default('ACTIVO')
});

const supplierSchema = Joi.object({
  nombre: Joi.string().max(255).required(),
  nif: Joi.string().max(50).required(),
  saldo: Joi.number().min(0).default(0),
  condPagoId: Joi.string().uuid().allow(null).allow('').default(null)
});

const productSchema = Joi.object({
  sku: Joi.string().max(50).required(),
  descripcion: Joi.string().max(255).required(),
  uom: Joi.string().max(25).required(),
  precioBase: Joi.number().min(0).default(0),
  activo: Joi.boolean().default(true)
});

const warehouseSchema = Joi.object({
  codigo: Joi.string().max(50).required(),
  nombre: Joi.string().max(255).required(),
  direccion: Joi.object().unknown(true).allow(null).optional()
});

const paymentTermSchema = Joi.object({
  nombre: Joi.string().max(100).required(),
  dias: Joi.number().integer().min(0).required()
});

const priceListSchema = Joi.object({
  nombre: Joi.string().max(100).required(),
  moneda: Joi.string().length(3).uppercase().required(),
  activa: Joi.boolean().default(true)
});

const taxTypeSchema = Joi.object({
  nombre: Joi.string().max(150).required(),
  tasa: Joi.number().min(0).max(999.99).required(),
  tipo: Joi.string().valid('ISV', 'ISC', 'RETENCION', 'EXENTO').required(),
  aplicacion: Joi.string().valid('VENTA', 'COMPRA', 'AMBOS').default('VENTA')
});

const locationSchema = Joi.object({
  almacenId: Joi.string().uuid().required(),
  codigo: Joi.string().max(50).required(),
  descripcion: Joi.string().allow(null).allow('').default(null)
});

catalogsRouter.get(
  '/clientes',
  authorize('catalogos:ver'),
  auditTrail('catalogos.clientes.listar'),
  async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 25);
    const result = await service.getClients(page, pageSize);
    res.json(result);
  }
);

catalogsRouter.post(
  '/clientes',
  authorize('catalogos:crear'),
  auditTrail('catalogos.clientes.crear'),
  async (req: Request, res: Response) => {
    const { error, value } = clientSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const cliente = await service.createClient(value);
    res.status(201).json({ data: cliente });
  }
);

catalogsRouter.put(
  '/clientes/:id',
  authorize('catalogos:editar'),
  auditTrail('catalogos.clientes.actualizar'),
  async (req: Request, res: Response) => {
    const { error, value } = clientSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const updated = await service.updateClient(req.params.id, value);
    if (!updated) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json({ data: updated });
  }
);

catalogsRouter.delete(
  '/clientes/:id',
  authorize('catalogos:anular'),
  auditTrail('catalogos.clientes.eliminar'),
  async (req: Request, res: Response) => {
    const deleted = await service.deleteClient(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json({ success: true });
  }
);

catalogsRouter.get(
  '/proveedores',
  authorize('catalogos:ver'),
  auditTrail('catalogos.proveedores.listar'),
  async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 25);
    const result = await service.getSuppliers(page, pageSize);
    res.json(result);
  }
);

catalogsRouter.post(
  '/proveedores',
  authorize('catalogos:crear'),
  auditTrail('catalogos.proveedores.crear'),
  async (req: Request, res: Response) => {
    const { error, value } = supplierSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const proveedor = await service.createSupplier({
      nombre: value.nombre,
      nif: value.nif,
      saldo: value.saldo,
      condPagoId: value.condPagoId || null
    });

    res.status(201).json({ data: proveedor });
  }
);

catalogsRouter.put(
  '/proveedores/:id',
  authorize('catalogos:editar'),
  auditTrail('catalogos.proveedores.actualizar'),
  async (req: Request, res: Response) => {
    const { error, value } = supplierSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const updated = await service.updateSupplier(req.params.id, {
      nombre: value.nombre,
      nif: value.nif,
      saldo: value.saldo,
      condPagoId: value.condPagoId || null
    });

    if (!updated) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    res.json({ data: updated });
  }
);

catalogsRouter.delete(
  '/proveedores/:id',
  authorize('catalogos:anular'),
  auditTrail('catalogos.proveedores.eliminar'),
  async (req: Request, res: Response) => {
    const deleted = await service.deleteSupplier(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    res.json({ success: true });
  }
);

catalogsRouter.get(
  '/productos',
  authorize('catalogos:ver'),
  auditTrail('catalogos.productos.listar'),
  async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 25);
    const result = await service.getProducts(page, pageSize);
    res.json(result);
  }
);

catalogsRouter.post(
  '/productos',
  authorize('catalogos:crear'),
  auditTrail('catalogos.productos.crear'),
  async (req: Request, res: Response) => {
    const { error, value } = productSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const producto = await service.createProduct(value);
    res.status(201).json({ data: producto });
  }
);

catalogsRouter.put(
  '/productos/:id',
  authorize('catalogos:editar'),
  auditTrail('catalogos.productos.actualizar'),
  async (req: Request, res: Response) => {
    const { error, value } = productSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const updated = await service.updateProduct(req.params.id, value);
    if (!updated) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ data: updated });
  }
);

catalogsRouter.delete(
  '/productos/:id',
  authorize('catalogos:anular'),
  auditTrail('catalogos.productos.eliminar'),
  async (req: Request, res: Response) => {
    const deleted = await service.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ success: true });
  }
);

catalogsRouter.get(
  '/almacenes',
  authorize('catalogos:ver'),
  auditTrail('catalogos.almacenes.listar'),
  async (_req: Request, res: Response) => {
    const result = await service.getWarehouses();
    res.json({ data: result });
  }
);

catalogsRouter.post(
  '/almacenes',
  authorize('catalogos:crear'),
  auditTrail('catalogos.almacenes.crear'),
  async (req: Request, res: Response) => {
    const { error, value } = warehouseSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const almacen = await service.createWarehouse(value);
    res.status(201).json({ data: almacen });
  }
);

catalogsRouter.put(
  '/almacenes/:id',
  authorize('catalogos:editar'),
  auditTrail('catalogos.almacenes.actualizar'),
  async (req: Request, res: Response) => {
    const { error, value } = warehouseSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const updated = await service.updateWarehouse(req.params.id, value);
    if (!updated) {
      return res.status(404).json({ message: 'Almacén no encontrado' });
    }

    res.json({ data: updated });
  }
);

catalogsRouter.delete(
  '/almacenes/:id',
  authorize('catalogos:anular'),
  auditTrail('catalogos.almacenes.eliminar'),
  async (req: Request, res: Response) => {
    const deleted = await service.deleteWarehouse(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Almacén no encontrado' });
    }

    res.json({ success: true });
  }
);

catalogsRouter.get(
  '/condiciones-pago',
  authorize('catalogos:ver'),
  auditTrail('catalogos.condiciones_pago.listar'),
  async (_req: Request, res: Response) => {
    const data = await service.getPaymentTerms();
    res.json({ data });
  }
);

catalogsRouter.post(
  '/condiciones-pago',
  authorize('catalogos:crear'),
  auditTrail('catalogos.condiciones_pago.crear'),
  async (req: Request, res: Response) => {
    const { error, value } = paymentTermSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const term = await service.createPaymentTerm(value);
    res.status(201).json({ data: term });
  }
);

catalogsRouter.put(
  '/condiciones-pago/:id',
  authorize('catalogos:editar'),
  auditTrail('catalogos.condiciones_pago.actualizar'),
  async (req: Request, res: Response) => {
    const { error, value } = paymentTermSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const updated = await service.updatePaymentTerm(req.params.id, value);
    if (!updated) {
      return res.status(404).json({ message: 'Condición de pago no encontrada' });
    }

    res.json({ data: updated });
  }
);

catalogsRouter.delete(
  '/condiciones-pago/:id',
  authorize('catalogos:anular'),
  auditTrail('catalogos.condiciones_pago.eliminar'),
  async (req: Request, res: Response) => {
    const deleted = await service.deletePaymentTerm(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Condición de pago no encontrada' });
    }

    res.json({ success: true });
  }
);

catalogsRouter.get(
  '/listas-precio',
  authorize('catalogos:ver'),
  auditTrail('catalogos.listas_precio.listar'),
  async (_req: Request, res: Response) => {
    const data = await service.getPriceLists();
    res.json({ data });
  }
);

catalogsRouter.post(
  '/listas-precio',
  authorize('catalogos:crear'),
  auditTrail('catalogos.listas_precio.crear'),
  async (req: Request, res: Response) => {
    const { error, value } = priceListSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const lista = await service.createPriceList(value);
    res.status(201).json({ data: lista });
  }
);

catalogsRouter.put(
  '/listas-precio/:id',
  authorize('catalogos:editar'),
  auditTrail('catalogos.listas_precio.actualizar'),
  async (req: Request, res: Response) => {
    const { error, value } = priceListSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const updated = await service.updatePriceList(req.params.id, value);
    if (!updated) {
      return res.status(404).json({ message: 'Lista de precio no encontrada' });
    }

    res.json({ data: updated });
  }
);

catalogsRouter.delete(
  '/listas-precio/:id',
  authorize('catalogos:anular'),
  auditTrail('catalogos.listas_precio.eliminar'),
  async (req: Request, res: Response) => {
    const deleted = await service.deletePriceList(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Lista de precio no encontrada' });
    }

    res.json({ success: true });
  }
);

catalogsRouter.get(
  '/tipos-impuesto',
  authorize('catalogos:ver'),
  auditTrail('catalogos.tipos_impuesto.listar'),
  async (_req: Request, res: Response) => {
    const data = await service.getTaxTypes();
    res.json({ data });
  }
);

catalogsRouter.post(
  '/tipos-impuesto',
  authorize('catalogos:crear'),
  auditTrail('catalogos.tipos_impuesto.crear'),
  async (req: Request, res: Response) => {
    const { error, value } = taxTypeSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const tipo = await service.createTaxType(value);
    res.status(201).json({ data: tipo });
  }
);

catalogsRouter.put(
  '/tipos-impuesto/:id',
  authorize('catalogos:editar'),
  auditTrail('catalogos.tipos_impuesto.actualizar'),
  async (req: Request, res: Response) => {
    const { error, value } = taxTypeSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const updated = await service.updateTaxType(req.params.id, value);
    if (!updated) {
      return res.status(404).json({ message: 'Tipo de impuesto no encontrado' });
    }

    res.json({ data: updated });
  }
);

catalogsRouter.delete(
  '/tipos-impuesto/:id',
  authorize('catalogos:anular'),
  auditTrail('catalogos.tipos_impuesto.eliminar'),
  async (req: Request, res: Response) => {
    const deleted = await service.deleteTaxType(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Tipo de impuesto no encontrado' });
    }

    res.json({ success: true });
  }
);

catalogsRouter.get(
  '/ubicaciones',
  authorize('catalogos:ver'),
  auditTrail('catalogos.ubicaciones.listar'),
  async (_req: Request, res: Response) => {
    const data = await service.getLocations();
    res.json({ data });
  }
);

catalogsRouter.post(
  '/ubicaciones',
  authorize('catalogos:crear'),
  auditTrail('catalogos.ubicaciones.crear'),
  async (req: Request, res: Response) => {
    const { error, value } = locationSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const ubicacion = await service.createLocation({
      almacenId: value.almacenId,
      codigo: value.codigo,
      descripcion: value.descripcion || null
    });
    res.status(201).json({ data: ubicacion });
  }
);

catalogsRouter.put(
  '/ubicaciones/:id',
  authorize('catalogos:editar'),
  auditTrail('catalogos.ubicaciones.actualizar'),
  async (req: Request, res: Response) => {
    const { error, value } = locationSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      return res.status(400).json({ message: 'Datos inválidos', details: error.details });
    }

    const updated = await service.updateLocation(req.params.id, {
      almacenId: value.almacenId,
      codigo: value.codigo,
      descripcion: value.descripcion || null
    });
    if (!updated) {
      return res.status(404).json({ message: 'Ubicación no encontrada' });
    }

    res.json({ data: updated });
  }
);

catalogsRouter.delete(
  '/ubicaciones/:id',
  authorize('catalogos:anular'),
  auditTrail('catalogos.ubicaciones.eliminar'),
  async (req: Request, res: Response) => {
    const deleted = await service.deleteLocation(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Ubicación no encontrada' });
    }

    res.json({ success: true });
  }
);
