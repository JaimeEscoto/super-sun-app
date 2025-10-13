-- ERP inicial para manufactura en México (MXN) con IVA multi-tasa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('ADMINISTRADOR','CONTADOR','VENTAS','COMPRAS','ALMACEN','AUDITOR')),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS condiciones_pago (
    cond_pago_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    dias INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS listas_precio (
    lista_precio_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    moneda CHAR(3) NOT NULL DEFAULT 'MXN',
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS clientes (
    cliente_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo TEXT NOT NULL UNIQUE,
    razon_social TEXT NOT NULL,
    nif TEXT NOT NULL,
    direccion JSONB,
    contactos JSONB,
    cond_pago_id UUID REFERENCES condiciones_pago(cond_pago_id),
    limite_credito NUMERIC(14,2) DEFAULT 0,
    lista_precio_id UUID REFERENCES listas_precio(lista_precio_id),
    retenciones JSONB,
    saldo NUMERIC(14,2) DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS proveedores (
    proveedor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    nif TEXT NOT NULL,
    direccion JSONB,
    contactos JSONB,
    banco JSONB,
    cond_pago_id UUID REFERENCES condiciones_pago(cond_pago_id),
    retenciones JSONB,
    saldo NUMERIC(14,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS tipos_impuesto (
    tipo_impuesto_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT NOT NULL,
    tasa NUMERIC(5,2) NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('IVA','IEPS','RETENCION','EXENTO')),
    aplicacion TEXT NOT NULL DEFAULT 'VENTA'
);

CREATE TABLE IF NOT EXISTS productos (
    producto_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    uom TEXT NOT NULL,
    familia TEXT,
    tipo TEXT NOT NULL DEFAULT 'BIEN',
    tipo_impuesto_id UUID REFERENCES tipos_impuesto(tipo_impuesto_id),
    costo_estandar NUMERIC(14,4) NOT NULL DEFAULT 0,
    costo_promedio NUMERIC(14,4) NOT NULL DEFAULT 0,
    precio_base NUMERIC(14,2) NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS almacenes (
    almacen_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    direccion JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS ubicaciones (
    ubicacion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    almacen_id UUID NOT NULL REFERENCES almacenes(almacen_id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    descripcion TEXT,
    UNIQUE(almacen_id, codigo)
);

CREATE TABLE IF NOT EXISTS stock (
    producto_id UUID NOT NULL REFERENCES productos(producto_id),
    almacen_id UUID NOT NULL REFERENCES almacenes(almacen_id),
    cantidad NUMERIC(18,6) NOT NULL DEFAULT 0,
    costo_promedio NUMERIC(14,4) NOT NULL DEFAULT 0,
    PRIMARY KEY (producto_id, almacen_id)
);

CREATE TABLE IF NOT EXISTS ordenes_compra (
    oc_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proveedor_id UUID NOT NULL REFERENCES proveedores(proveedor_id),
    fecha DATE NOT NULL,
    estado TEXT NOT NULL DEFAULT 'BORRADOR',
    moneda CHAR(3) NOT NULL DEFAULT 'MXN',
    condiciones_pago TEXT,
    total NUMERIC(14,2) DEFAULT 0,
    impuestos NUMERIC(14,2) DEFAULT 0,
    created_by UUID REFERENCES usuarios(id),
    approved_by UUID REFERENCES usuarios(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ordenes_compra_lineas (
    oc_linea_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oc_id UUID NOT NULL REFERENCES ordenes_compra(oc_id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(producto_id),
    cantidad NUMERIC(14,4) NOT NULL,
    precio NUMERIC(14,4) NOT NULL,
    impuestos JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS pedidos (
    pedido_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(cliente_id),
    fecha DATE NOT NULL,
    estado TEXT NOT NULL DEFAULT 'BORRADOR',
    moneda CHAR(3) NOT NULL DEFAULT 'MXN',
    condiciones_pago TEXT,
    vendedor_id UUID REFERENCES usuarios(id),
    total NUMERIC(14,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS pedidos_lineas (
    pedido_linea_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(pedido_id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(producto_id),
    cantidad NUMERIC(14,4) NOT NULL,
    precio NUMERIC(14,4) NOT NULL,
    descuentos NUMERIC(14,4) DEFAULT 0,
    impuestos JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS recepciones (
    recepcion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oc_id UUID REFERENCES ordenes_compra(oc_id),
    fecha DATE NOT NULL,
    estado TEXT NOT NULL DEFAULT 'BORRADOR',
    created_by UUID REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS recepciones_lineas (
    recepcion_linea_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recepcion_id UUID NOT NULL REFERENCES recepciones(recepcion_id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(producto_id),
    cantidad NUMERIC(14,4) NOT NULL,
    costo NUMERIC(14,4) NOT NULL
);

CREATE TABLE IF NOT EXISTS facturas (
    factura_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero TEXT NOT NULL UNIQUE,
    cliente_id UUID NOT NULL REFERENCES clientes(cliente_id),
    pedido_id UUID REFERENCES pedidos(pedido_id),
    fecha_emision DATE NOT NULL,
    moneda CHAR(3) NOT NULL DEFAULT 'MXN',
    tipo_comprobante TEXT NOT NULL,
    total NUMERIC(14,2) NOT NULL,
    subtotal NUMERIC(14,2) NOT NULL,
    impuestos JSONB NOT NULL,
    estado TEXT NOT NULL DEFAULT 'EMITIDA',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS facturas_lineas (
    factura_linea_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factura_id UUID NOT NULL REFERENCES facturas(factura_id) ON DELETE CASCADE,
    descripcion TEXT NOT NULL,
    cantidad NUMERIC(14,4) NOT NULL,
    precio_unitario NUMERIC(14,4) NOT NULL,
    impuestos JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS pagos (
    pago_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    factura_id UUID REFERENCES facturas(factura_id),
    proveedor_id UUID REFERENCES proveedores(proveedor_id),
    tipo TEXT NOT NULL CHECK (tipo IN ('COBRO','PAGO')),
    fecha DATE NOT NULL,
    monto NUMERIC(14,2) NOT NULL,
    metodo TEXT NOT NULL,
    referencia TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS asientos (
    asiento_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha DATE NOT NULL,
    diario TEXT NOT NULL,
    descripcion TEXT,
    total_debe NUMERIC(14,2) NOT NULL,
    total_haber NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS asientos_detalle (
    asiento_detalle_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asiento_id UUID NOT NULL REFERENCES asientos(asiento_id) ON DELETE CASCADE,
    cuenta_id TEXT NOT NULL,
    centro_costo_id TEXT,
    debe NUMERIC(14,2) DEFAULT 0,
    haber NUMERIC(14,2) DEFAULT 0,
    doc_ref TEXT
);

CREATE TABLE IF NOT EXISTS auditoria (
    auditoria_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entidad TEXT NOT NULL,
    entidad_id UUID NOT NULL,
    accion TEXT NOT NULL,
    payload_antes JSONB,
    payload_despues JSONB,
    usuario_id UUID REFERENCES usuarios(id),
    realizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vistas de reporte
CREATE OR REPLACE VIEW reporte_ventas_cliente AS
SELECT f.cliente_id,
       f.fecha_emision AS fecha,
       f.total,
       SUM(fl.precio_unitario * fl.cantidad) - SUM(fl.precio_unitario * fl.cantidad * 0.3) AS margen
FROM facturas f
JOIN facturas_lineas fl ON fl.factura_id = f.factura_id
GROUP BY f.cliente_id, f.fecha_emision, f.total;

CREATE OR REPLACE VIEW reporte_antiguedad_inventario AS
SELECT producto_id,
       'DEFAULT'::uuid AS almacen_id,
       30 AS dias_en_inventario,
       0 AS cantidad,
       0 AS valor
FROM productos;

CREATE OR REPLACE VIEW reporte_antiguedad_cxc_cxp AS
SELECT 'CXC'::text AS tipo, '0-30'::text AS tramo, 0::numeric AS total
UNION ALL
SELECT 'CXP', '0-30', 0;
