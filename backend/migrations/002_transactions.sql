-- Registro de transacciones operativas y funciones de negocio
CREATE TABLE IF NOT EXISTS transacciones (
    transaccion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo TEXT NOT NULL,
    referencia_id UUID NOT NULL,
    descripcion TEXT,
    datos JSONB NOT NULL DEFAULT '{}'::jsonb,
    fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transacciones_tipo_fecha ON transacciones (tipo, fecha DESC);

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    movimiento_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES productos(producto_id),
    almacen_id UUID NOT NULL REFERENCES almacenes(almacen_id),
    fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
    tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA', 'AJUSTE')),
    cantidad NUMERIC(18,6) NOT NULL,
    costo_unitario NUMERIC(14,4) NOT NULL,
    saldo_cantidad NUMERIC(18,6) NOT NULL,
    saldo_costo NUMERIC(14,4) NOT NULL,
    motivo TEXT,
    created_by UUID REFERENCES usuarios(id)
);

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_producto_fecha
    ON movimientos_inventario (producto_id, fecha DESC);

CREATE OR REPLACE VIEW kardex AS
SELECT
    movimiento_id AS id,
    producto_id,
    almacen_id,
    fecha,
    tipo,
    cantidad,
    costo_unitario,
    saldo_cantidad,
    saldo_costo,
    motivo
FROM movimientos_inventario;

CREATE OR REPLACE VIEW stock_valuado AS
SELECT
    s.producto_id,
    s.almacen_id,
    s.cantidad,
    CASE WHEN s.cantidad = 0 THEN 0 ELSE s.costo_promedio END AS costo_unitario,
    s.cantidad * s.costo_promedio AS valor_total
FROM stock s;

CREATE OR REPLACE FUNCTION crear_orden_compra(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_oc_id UUID;
    v_linea JSONB;
    v_cantidad NUMERIC(14,4);
    v_precio NUMERIC(14,4);
    v_total NUMERIC(14,2) := 0;
    v_impuestos NUMERIC(14,2) := 0;
    v_estado TEXT := COALESCE(payload->>'estado', 'BORRADOR');
    v_usuario UUID;
    v_solicitante UUID := NULLIF(payload->>'solicitanteId', '')::UUID;
BEGIN
    IF payload->>'proveedorId' IS NULL THEN
        RAISE EXCEPTION 'El proveedor es obligatorio';
    END IF;

    IF payload->>'fecha' IS NULL THEN
        RAISE EXCEPTION 'La fecha es obligatoria';
    END IF;

    IF COALESCE(jsonb_array_length(payload->'lineas'), 0) = 0 THEN
        RAISE EXCEPTION 'Debe registrar al menos una línea';
    END IF;

    v_usuario := NULLIF(payload->>'usuarioId', '')::UUID;
    IF v_usuario IS NULL THEN
        v_usuario := v_solicitante;
    END IF;

    INSERT INTO ordenes_compra (proveedor_id, fecha, estado, moneda, condiciones_pago, created_by)
    VALUES (
        (payload->>'proveedorId')::UUID,
        (payload->>'fecha')::DATE,
        v_estado,
        COALESCE(payload->>'moneda', 'HNL'),
        payload->>'condicionesPago',
        v_usuario
    )
    RETURNING oc_id INTO v_oc_id;

    FOR v_linea IN SELECT value FROM jsonb_array_elements(payload->'lineas') AS value LOOP
        v_cantidad := COALESCE((v_linea->>'cantidad')::NUMERIC, 0);
        v_precio := COALESCE((v_linea->>'precio')::NUMERIC, 0);

        INSERT INTO ordenes_compra_lineas (oc_id, producto_id, cantidad, precio, impuestos)
        VALUES (
            v_oc_id,
            (v_linea->>'productoId')::UUID,
            v_cantidad,
            v_precio,
            COALESCE(v_linea->'impuestos', '[]'::JSONB)
        );

        v_total := v_total + (v_cantidad * v_precio);
        v_impuestos := v_impuestos + COALESCE(
            (
                SELECT SUM(v_cantidad * v_precio * (impuesto::NUMERIC) / 100)
                FROM jsonb_array_elements_text(COALESCE(v_linea->'impuestos', '[]'::JSONB)) AS impuesto
            ),
            0
        );
    END LOOP;

    UPDATE ordenes_compra
    SET total = v_total + v_impuestos,
        impuestos = v_impuestos,
        updated_at = now()
    WHERE oc_id = v_oc_id;

    INSERT INTO transacciones (tipo, referencia_id, descripcion, datos, created_by)
    VALUES (
        'ORDEN_COMPRA',
        v_oc_id,
        'Orden de compra registrada',
        jsonb_build_object(
            'proveedorId', payload->>'proveedorId',
        'moneda', COALESCE(payload->>'moneda', 'HNL'),
        'total', v_total + v_impuestos,
        'estado', v_estado,
        'solicitanteId', payload->>'solicitanteId',
        'lineas', payload->'lineas'
    ),
        v_usuario
    );

    RETURN v_oc_id;
END;
$$;

CREATE OR REPLACE FUNCTION crear_pedido(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_pedido_id UUID;
    v_linea JSONB;
    v_cantidad NUMERIC(14,4);
    v_precio NUMERIC(14,4);
    v_descuento NUMERIC(14,4);
    v_total NUMERIC(14,2) := 0;
    v_usuario UUID := NULLIF(payload->>'usuarioId', '')::UUID;
BEGIN
    IF payload->>'clienteId' IS NULL THEN
        RAISE EXCEPTION 'El cliente es obligatorio';
    END IF;

    IF payload->>'fecha' IS NULL THEN
        RAISE EXCEPTION 'La fecha es obligatoria';
    END IF;

    IF COALESCE(jsonb_array_length(payload->'lineas'), 0) = 0 THEN
        RAISE EXCEPTION 'Debe registrar al menos una línea';
    END IF;

    INSERT INTO pedidos (cliente_id, fecha, estado, moneda, condiciones_pago, vendedor_id, created_by)
    VALUES (
        (payload->>'clienteId')::UUID,
        (payload->>'fecha')::DATE,
        COALESCE(payload->>'estado', 'BORRADOR'),
        COALESCE(payload->>'moneda', 'HNL'),
        payload->>'condicionesPago',
        NULLIF(payload->>'vendedorId', '')::UUID,
        v_usuario
    )
    RETURNING pedido_id INTO v_pedido_id;

    FOR v_linea IN SELECT value FROM jsonb_array_elements(payload->'lineas') AS value LOOP
        v_cantidad := COALESCE((v_linea->>'cantidad')::NUMERIC, 0);
        v_precio := COALESCE((v_linea->>'precio')::NUMERIC, 0);
        v_descuento := COALESCE((v_linea->>'descuentos')::NUMERIC, 0);

        INSERT INTO pedidos_lineas (pedido_id, producto_id, cantidad, precio, descuentos, impuestos)
        VALUES (
            v_pedido_id,
            (v_linea->>'productoId')::UUID,
            v_cantidad,
            v_precio,
            v_descuento,
            COALESCE(v_linea->'impuestos', '[]'::JSONB)
        );

        v_total := v_total + (v_cantidad * v_precio) - v_descuento;
    END LOOP;

    UPDATE pedidos
    SET total = v_total,
        updated_at = now()
    WHERE pedido_id = v_pedido_id;

    INSERT INTO transacciones (tipo, referencia_id, descripcion, datos, created_by)
    VALUES (
        'PEDIDO_VENTA',
        v_pedido_id,
        'Pedido de venta registrado',
        jsonb_build_object(
        'clienteId', payload->>'clienteId',
        'moneda', COALESCE(payload->>'moneda', 'HNL'),
        'vendedorId', payload->>'vendedorId',
        'total', v_total,
        'lineas', payload->'lineas'
    ),
        v_usuario
    );

    RETURN v_pedido_id;
END;
$$;

CREATE OR REPLACE FUNCTION registrar_ajuste_inventario(
    p_producto_id UUID,
    p_almacen_id UUID,
    p_cantidad NUMERIC,
    p_motivo TEXT,
    p_costo_unitario NUMERIC DEFAULT NULL,
    p_usuario_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock RECORD;
    v_tipo TEXT;
    v_costo NUMERIC(14,4);
    v_total_valor NUMERIC(18,6);
    v_nueva_cantidad NUMERIC(18,6);
    v_nuevo_costo NUMERIC(14,4);
    v_movimiento_id UUID;
BEGIN
    IF p_cantidad = 0 THEN
        RAISE EXCEPTION 'La cantidad no puede ser cero';
    END IF;

    v_tipo := CASE WHEN p_cantidad > 0 THEN 'ENTRADA' ELSE 'SALIDA' END;

    SELECT cantidad, costo_promedio
    INTO v_stock
    FROM stock
    WHERE producto_id = p_producto_id AND almacen_id = p_almacen_id
    FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO stock (producto_id, almacen_id, cantidad, costo_promedio)
        VALUES (p_producto_id, p_almacen_id, 0, 0)
        RETURNING cantidad, costo_promedio INTO v_stock;
    END IF;

    IF v_tipo = 'SALIDA' AND v_stock.cantidad + p_cantidad < 0 THEN
        RAISE EXCEPTION 'Stock insuficiente para realizar el ajuste';
    END IF;

    IF p_cantidad > 0 THEN
        v_costo := COALESCE(p_costo_unitario, v_stock.costo_promedio, 0);
    ELSE
        v_costo := v_stock.costo_promedio;
    END IF;

    v_total_valor := (v_stock.cantidad * v_stock.costo_promedio) + (p_cantidad * v_costo);
    v_nueva_cantidad := v_stock.cantidad + p_cantidad;

    IF v_nueva_cantidad = 0 THEN
        v_nuevo_costo := 0;
    ELSE
        v_nuevo_costo := v_total_valor / v_nueva_cantidad;
    END IF;

    UPDATE stock
    SET cantidad = v_nueva_cantidad,
        costo_promedio = v_nuevo_costo
    WHERE producto_id = p_producto_id AND almacen_id = p_almacen_id;

    INSERT INTO movimientos_inventario (
        producto_id,
        almacen_id,
        tipo,
        cantidad,
        costo_unitario,
        saldo_cantidad,
        saldo_costo,
        motivo,
        created_by
    )
    VALUES (
        p_producto_id,
        p_almacen_id,
        CASE WHEN p_cantidad > 0 THEN 'ENTRADA' ELSE 'SALIDA' END,
        p_cantidad,
        v_costo,
        v_nueva_cantidad,
        v_nuevo_costo,
        p_motivo,
        p_usuario_id
    )
    RETURNING movimiento_id INTO v_movimiento_id;

    INSERT INTO transacciones (tipo, referencia_id, descripcion, datos, created_by)
    VALUES (
        'AJUSTE_INVENTARIO',
        v_movimiento_id,
        p_motivo,
        jsonb_build_object(
            'productoId', p_producto_id,
            'almacenId', p_almacen_id,
            'cantidad', p_cantidad,
            'costoUnitario', v_costo,
            'saldoCantidad', v_nueva_cantidad,
            'saldoCosto', v_nuevo_costo
        ),
        p_usuario_id
    );

    RETURN v_movimiento_id;
END;
$$;
