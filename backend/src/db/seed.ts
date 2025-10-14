import bcrypt from 'bcryptjs';

import { query } from './index.js';
import { pool } from './pool.js';

interface Identifier {
  id: string;
}

const findOrCreate = async <T extends Identifier>(
  selectSql: string,
  selectParams: unknown[],
  insertSql: string,
  insertParams: unknown[]
): Promise<T> => {
  const existing = await query<T>(selectSql, selectParams);
  if (existing.length > 0) {
    return existing[0];
  }

  const inserted = await query<T>(insertSql, insertParams);
  return inserted[0];
};

const seed = async () => {
  const passwordHash = await bcrypt.hash('Demo123*', 10);

  const adminUser = await findOrCreate<Identifier>(
    'SELECT id FROM usuarios WHERE email = $1',
    ['director@solarishn.com'],
    'INSERT INTO usuarios (email, password_hash, rol) VALUES ($1, $2, $3) RETURNING id',
    ['director@solarishn.com', passwordHash, 'ADMINISTRADOR']
  );

  const financeUser = await findOrCreate<Identifier>(
    'SELECT id FROM usuarios WHERE email = $1',
    ['finanzas@solarishn.com'],
    'INSERT INTO usuarios (email, password_hash, rol) VALUES ($1, $2, $3) RETURNING id',
    ['finanzas@solarishn.com', passwordHash, 'CONTADOR']
  );

  const contado = await findOrCreate<Identifier>(
    'SELECT cond_pago_id AS id FROM condiciones_pago WHERE nombre = $1',
    ['Contado 0 días'],
    'INSERT INTO condiciones_pago (nombre, dias) VALUES ($1, $2) RETURNING cond_pago_id AS id',
    ['Contado 0 días', 0]
  );

  const credito30 = await findOrCreate<Identifier>(
    'SELECT cond_pago_id AS id FROM condiciones_pago WHERE nombre = $1',
    ['Crédito 30 días'],
    'INSERT INTO condiciones_pago (nombre, dias) VALUES ($1, $2) RETURNING cond_pago_id AS id',
    ['Crédito 30 días', 30]
  );

  const listaHn = await findOrCreate<Identifier>(
    'SELECT lista_precio_id AS id FROM listas_precio WHERE nombre = $1',
    ['Lista industria HN'],
    'INSERT INTO listas_precio (nombre, moneda, activa) VALUES ($1, $2, $3) RETURNING lista_precio_id AS id',
    ['Lista industria HN', 'HNL', true]
  );

  const impuesto15 = await findOrCreate<Identifier>(
    'SELECT tipo_impuesto_id AS id FROM tipos_impuesto WHERE nombre = $1',
    ['ISV 15%'],
    'INSERT INTO tipos_impuesto (nombre, tasa, tipo, aplicacion) VALUES ($1, $2, $3, $4) RETURNING tipo_impuesto_id AS id',
    ['ISV 15%', 15, 'ISV', 'VENTA']
  );

  await findOrCreate<Identifier>(
    'SELECT tipo_impuesto_id AS id FROM tipos_impuesto WHERE nombre = $1',
    ['ISV 18%'],
    'INSERT INTO tipos_impuesto (nombre, tasa, tipo, aplicacion) VALUES ($1, $2, $3, $4) RETURNING tipo_impuesto_id AS id',
    ['ISV 18%', 18, 'ISV', 'VENTA']
  );

  const cliente = await findOrCreate<Identifier>(
    'SELECT cliente_id AS id FROM clientes WHERE codigo = $1',
    ['CLI-HN-001'],
    `INSERT INTO clientes (codigo, razon_social, nif, direccion, contactos, cond_pago_id, limite_credito, lista_precio_id, retenciones, saldo, estado, created_by)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9::jsonb, $10, $11, $12)
     RETURNING cliente_id AS id`,
    [
      'CLI-HN-001',
      'Industria Solar del Norte',
      '08011999123456',
      JSON.stringify({ ciudad: 'San Pedro Sula', direccion: 'Bulevar del Este, Km 5' }),
      JSON.stringify([{ nombre: 'María Ruiz', cargo: 'Compras', telefono: '+504 9999-0001' }]),
      credito30.id,
      500000,
      listaHn.id,
      JSON.stringify([{ tipo: 'ISR', porcentaje: 1.5 }]),
      185000,
      'ACTIVO',
      adminUser.id
    ]
  );

  const proveedor = await findOrCreate<Identifier>(
    'SELECT proveedor_id AS id FROM proveedores WHERE nombre = $1',
    ['Proveedora Andina HN'],
    `INSERT INTO proveedores (nombre, nif, direccion, contactos, banco, cond_pago_id, retenciones, saldo, created_by)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5::jsonb, $6, $7::jsonb, $8, $9)
     RETURNING proveedor_id AS id`,
    [
      'Proveedora Andina HN',
      '08011990000123',
      JSON.stringify({ ciudad: 'Tegucigalpa', direccion: 'Col. San Ignacio, calle 3' }),
      JSON.stringify([{ nombre: 'Carlos Soto', cargo: 'Ventas', telefono: '+504 9876-1111' }]),
      JSON.stringify({ banco: 'BAC', cuenta: '001-145698-5', moneda: 'HNL' }),
      contado.id,
      JSON.stringify([{ tipo: 'ISR', porcentaje: 1 }]),
      95000,
      adminUser.id
    ]
  );

  const producto = await findOrCreate<Identifier>(
    'SELECT producto_id AS id FROM productos WHERE sku = $1',
    ['SOL-MOD-500W'],
    `INSERT INTO productos (sku, descripcion, uom, familia, tipo, tipo_impuesto_id, costo_estandar, costo_promedio, precio_base, activo, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING producto_id AS id`,
    [
      'SOL-MOD-500W',
      'Módulo solar monocristalino 500W',
      'Unidad',
      'Paneles solares',
      'BIEN',
      impuesto15.id,
      210.5,
      208.3,
      325,
      true,
      adminUser.id
    ]
  );

  const almacen = await findOrCreate<Identifier>(
    'SELECT almacen_id AS id FROM almacenes WHERE codigo = $1',
    ['ALM-CEN'],
    `INSERT INTO almacenes (codigo, nombre, direccion, created_by)
     VALUES ($1, $2, $3::jsonb, $4)
     RETURNING almacen_id AS id`,
    ['ALM-CEN', 'Centro logístico SPS', JSON.stringify({ ciudad: 'San Pedro Sula', tipo: 'Principal' }), adminUser.id]
  );

  await findOrCreate<Identifier>(
    'SELECT ubicacion_id AS id FROM ubicaciones WHERE almacen_id = $1 AND codigo = $2',
    [almacen.id, 'RACK-A1'],
    `INSERT INTO ubicaciones (almacen_id, codigo, descripcion)
     VALUES ($1, $2, $3)
     RETURNING ubicacion_id AS id`,
    [almacen.id, 'RACK-A1', 'Rack principal zona fría']
  );

  await query(
    `INSERT INTO stock (producto_id, almacen_id, cantidad, costo_promedio)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (producto_id, almacen_id) DO UPDATE
     SET cantidad = EXCLUDED.cantidad, costo_promedio = EXCLUDED.costo_promedio`,
    [producto.id, almacen.id, 125.5, 208.3]
  );

  const hoy = new Date().toISOString().split('T')[0];

  const ordenCompra = await findOrCreate<Identifier>(
    'SELECT oc_id AS id FROM ordenes_compra WHERE proveedor_id = $1 AND fecha = $2',
    [proveedor.id, hoy],
    `INSERT INTO ordenes_compra (proveedor_id, fecha, estado, moneda, condiciones_pago, total, impuestos, created_by, approved_by, approved_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
     RETURNING oc_id AS id`,
    [
      proveedor.id,
      hoy,
      'APROBADA',
      'HNL',
      'Contado contra entrega',
      125000,
      18750,
      adminUser.id,
      financeUser.id
    ]
  );

  await findOrCreate<Identifier>(
    'SELECT oc_linea_id AS id FROM ordenes_compra_lineas WHERE oc_id = $1 AND producto_id = $2',
    [ordenCompra.id, producto.id],
    `INSERT INTO ordenes_compra_lineas (oc_id, producto_id, cantidad, precio, impuestos)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING oc_linea_id AS id`,
    [ordenCompra.id, producto.id, 400, 250, JSON.stringify([{ tipo: 'ISV', porcentaje: 15 }])]
  );

  const pedido = await findOrCreate<Identifier>(
    'SELECT pedido_id AS id FROM pedidos WHERE cliente_id = $1 AND fecha = $2',
    [cliente.id, hoy],
    `INSERT INTO pedidos (cliente_id, fecha, estado, moneda, condiciones_pago, vendedor_id, total, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING pedido_id AS id`,
    [
      cliente.id,
      hoy,
      'CONFIRMADO',
      'HNL',
      'Crédito 30 días',
      adminUser.id,
      245000,
      adminUser.id
    ]
  );

  await findOrCreate<Identifier>(
    'SELECT pedido_linea_id AS id FROM pedidos_lineas WHERE pedido_id = $1 AND producto_id = $2',
    [pedido.id, producto.id],
    `INSERT INTO pedidos_lineas (pedido_id, producto_id, cantidad, precio, descuentos, impuestos)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING pedido_linea_id AS id`,
    [pedido.id, producto.id, 180, 360, 0, JSON.stringify([{ tipo: 'ISV', porcentaje: 15 }])]
  );

  const recepcion = await findOrCreate<Identifier>(
    'SELECT recepcion_id AS id FROM recepciones WHERE oc_id = $1',
    [ordenCompra.id],
    `INSERT INTO recepciones (oc_id, fecha, estado, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING recepcion_id AS id`,
    [ordenCompra.id, hoy, 'COMPLETADA', adminUser.id]
  );

  await findOrCreate<Identifier>(
    'SELECT recepcion_linea_id AS id FROM recepciones_lineas WHERE recepcion_id = $1 AND producto_id = $2',
    [recepcion.id, producto.id],
    `INSERT INTO recepciones_lineas (recepcion_id, producto_id, cantidad, costo)
     VALUES ($1, $2, $3, $4)
     RETURNING recepcion_linea_id AS id`,
    [recepcion.id, producto.id, 400, 210.5]
  );

  const factura = await findOrCreate<Identifier>(
    'SELECT factura_id AS id FROM facturas WHERE numero = $1',
    ['FAC-HN-0001'],
    `INSERT INTO facturas (numero, cliente_id, pedido_id, fecha_emision, moneda, tipo_comprobante, total, subtotal, impuestos, estado, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
     RETURNING factura_id AS id`,
    [
      'FAC-HN-0001',
      cliente.id,
      pedido.id,
      hoy,
      'HNL',
      'FACTURA_ELECTRONICA',
      282750,
      245000,
      JSON.stringify([{ tipo: 'ISV', porcentaje: 15, monto: 37750 }]),
      'EMITIDA',
      adminUser.id
    ]
  );

  await findOrCreate<Identifier>(
    'SELECT factura_linea_id AS id FROM facturas_lineas WHERE factura_id = $1 AND descripcion = $2',
    [factura.id, 'Venta módulos solares 500W'],
    `INSERT INTO facturas_lineas (factura_id, descripcion, cantidad, precio_unitario, impuestos)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING factura_linea_id AS id`,
    [factura.id, 'Venta módulos solares 500W', 180, 360, JSON.stringify([{ tipo: 'ISV', porcentaje: 15 }])]
  );

  await findOrCreate<Identifier>(
    'SELECT pago_id AS id FROM pagos WHERE referencia = $1',
    ['PAGO-2024-001'],
    `INSERT INTO pagos (factura_id, tipo, fecha, monto, metodo, referencia, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING pago_id AS id`,
    [factura.id, 'COBRO', hoy, 150000, 'Transferencia bancaria', 'PAGO-2024-001', financeUser.id]
  );

  const asiento = await findOrCreate<Identifier>(
    'SELECT asiento_id AS id FROM asientos WHERE descripcion = $1',
    ['Reconocimiento de venta solar'],
    `INSERT INTO asientos (fecha, diario, descripcion, total_debe, total_haber, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING asiento_id AS id`,
    [hoy, 'VENTAS', 'Reconocimiento de venta solar', 282750, 282750, financeUser.id]
  );

  await findOrCreate<Identifier>(
    'SELECT asiento_detalle_id AS id FROM asientos_detalle WHERE asiento_id = $1 AND cuenta_id = $2',
    [asiento.id, '1101-01'],
    `INSERT INTO asientos_detalle (asiento_id, cuenta_id, centro_costo_id, debe, haber, doc_ref)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING asiento_detalle_id AS id`,
    [asiento.id, '1101-01', 'CC-VENTAS', 282750, 0, 'FAC-HN-0001']
  );

  await findOrCreate<Identifier>(
    'SELECT asiento_detalle_id AS id FROM asientos_detalle WHERE asiento_id = $1 AND cuenta_id = $2',
    [asiento.id, '4101-01'],
    `INSERT INTO asientos_detalle (asiento_id, cuenta_id, centro_costo_id, debe, haber, doc_ref)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING asiento_detalle_id AS id`,
    [asiento.id, '4101-01', 'CC-VENTAS', 0, 282750, 'FAC-HN-0001']
  );

  await findOrCreate<Identifier>(
    'SELECT auditoria_id AS id FROM auditoria WHERE entidad = $1 AND entidad_id = $2 AND accion = $3',
    ['clientes', cliente.id, 'CREATE'],
    `INSERT INTO auditoria (entidad, entidad_id, accion, payload_antes, payload_despues, usuario_id)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)
     RETURNING auditoria_id AS id`,
    [
      'clientes',
      cliente.id,
      'CREATE',
      JSON.stringify({}),
      JSON.stringify({ codigo: 'CLI-HN-001', razon_social: 'Industria Solar del Norte' }),
      adminUser.id
    ]
  );
};

seed()
  .then(() => {
    console.log('Datos de prueba insertados correctamente.');
  })
  .catch((error) => {
    console.error('Error al insertar datos de prueba:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
