-- Generación de facturas a partir de pedidos de venta
CREATE SEQUENCE IF NOT EXISTS factura_numero_seq START WITH 1 INCREMENT BY 1;

-- Alinear la secuencia con el último número usado
WITH ultimo_numero AS (
  SELECT MAX((regexp_replace(numero, '^.*-(\\d+)$', '\\1'))::BIGINT) AS max_num
  FROM facturas
  WHERE numero ~ '\\d+$'
)
SELECT setval(
  'factura_numero_seq',
  COALESCE((SELECT max_num FROM ultimo_numero), 1),
  (SELECT max_num IS NOT NULL FROM ultimo_numero)
);

CREATE OR REPLACE FUNCTION emitir_factura(payload JSONB)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_factura_id UUID;
    v_pedido RECORD;
    v_numero TEXT := NULLIF(payload->>'numero', '')::TEXT;
    v_moneda TEXT := COALESCE(payload->>'moneda', 'HNL');
    v_tipo_comprobante TEXT := payload->>'tipoComprobante';
    v_fecha DATE := (payload->>'fechaEmision')::DATE;
    v_usuario UUID := NULLIF(payload->>'usuarioId', '')::UUID;
    v_linea JSONB;
    v_impuesto JSONB;
    v_cantidad NUMERIC(14,4);
    v_precio NUMERIC(14,4);
    v_linea_subtotal NUMERIC(14,2);
    v_linea_impuestos JSONB;
    v_subtotal NUMERIC(14,2) := 0;
    v_impuestos_total NUMERIC(14,2) := 0;
    v_impuestos_map JSONB := '{}'::JSONB;
    v_impuesto_actual JSONB;
    v_impuestos_json JSONB := '[]'::JSONB;
    v_tipo_impuesto_id UUID;
    v_tasa NUMERIC(9,4);
    v_monto_impuesto NUMERIC(14,2);
    v_monto_acumulado NUMERIC(14,2);
BEGIN
    IF payload->>'pedidoId' IS NULL THEN
        RAISE EXCEPTION 'El pedido es obligatorio para emitir una factura';
    END IF;

    IF payload->>'fechaEmision' IS NULL THEN
        RAISE EXCEPTION 'La fecha de emisión es obligatoria';
    END IF;

    IF payload->>'tipoComprobante' IS NULL THEN
        RAISE EXCEPTION 'El tipo de comprobante es obligatorio';
    END IF;

    IF COALESCE(jsonb_array_length(payload->'lineas'), 0) = 0 THEN
        RAISE EXCEPTION 'Debe incluir al menos una línea en la factura';
    END IF;

    SELECT p.pedido_id,
           p.cliente_id,
           p.estado
    INTO v_pedido
    FROM pedidos p
    WHERE p.pedido_id = (payload->>'pedidoId')::UUID
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El pedido % no existe', payload->>'pedidoId';
    END IF;

    IF v_pedido.estado = 'FACTURADO' THEN
        RAISE EXCEPTION 'El pedido % ya fue facturado', v_pedido.pedido_id;
    END IF;

    IF v_numero IS NULL THEN
        v_numero := format('FAC-HN-%s', lpad(nextval('factura_numero_seq')::TEXT, 4, '0'));
    END IF;

    INSERT INTO facturas (
        numero,
        cliente_id,
        pedido_id,
        fecha_emision,
        moneda,
        tipo_comprobante,
        total,
        subtotal,
        impuestos,
        estado,
        created_by
    )
    VALUES (
        v_numero,
        v_pedido.cliente_id,
        v_pedido.pedido_id,
        v_fecha,
        v_moneda,
        v_tipo_comprobante,
        0,
        0,
        '[]'::JSONB,
        'EMITIDA',
        v_usuario
    )
    RETURNING factura_id INTO v_factura_id;

    FOR v_linea IN SELECT value FROM jsonb_array_elements(payload->'lineas') LOOP
        IF v_linea->>'descripcion' IS NULL THEN
            RAISE EXCEPTION 'Cada línea debe incluir una descripción';
        END IF;

        v_cantidad := COALESCE((v_linea->>'cantidad')::NUMERIC, 0);
        v_precio := COALESCE((v_linea->>'precioUnitario')::NUMERIC, 0);

        IF v_cantidad <= 0 THEN
            RAISE EXCEPTION 'La cantidad debe ser mayor a cero';
        END IF;

        IF v_precio < 0 THEN
            RAISE EXCEPTION 'El precio unitario no puede ser negativo';
        END IF;

        v_linea_subtotal := ROUND(v_cantidad * v_precio, 2);
        v_subtotal := v_subtotal + v_linea_subtotal;
        v_linea_impuestos := '[]'::JSONB;

        IF COALESCE(jsonb_array_length(v_linea->'impuestos'), 0) > 0 THEN
            FOR v_impuesto IN SELECT value FROM jsonb_array_elements(v_linea->'impuestos') LOOP
                v_tipo_impuesto_id := NULLIF(v_impuesto->>'tipoImpuestoId', '')::UUID;
                IF v_tipo_impuesto_id IS NULL THEN
                    RAISE EXCEPTION 'Cada impuesto debe incluir tipoImpuestoId válido';
                END IF;

                v_tasa := COALESCE((v_impuesto->>'tasa')::NUMERIC, 0);
                IF v_tasa < 0 THEN
                    RAISE EXCEPTION 'La tasa de impuesto no puede ser negativa';
                END IF;

                v_monto_impuesto := ROUND(v_linea_subtotal * v_tasa / 100, 2);
                v_impuestos_total := v_impuestos_total + v_monto_impuesto;

                v_linea_impuestos := v_linea_impuestos || jsonb_build_array(
                    jsonb_build_object(
                        'tipoImpuestoId', v_tipo_impuesto_id,
                        'tasa', v_tasa,
                        'monto', v_monto_impuesto
                    )
                );

                v_impuesto_actual := v_impuestos_map -> (v_tipo_impuesto_id::TEXT);
                v_monto_acumulado := COALESCE((v_impuesto_actual->>'monto')::NUMERIC, 0);

                v_impuestos_map := jsonb_set(
                    v_impuestos_map,
                    ARRAY[v_tipo_impuesto_id::TEXT],
                    jsonb_build_object(
                        'tipoImpuestoId', v_tipo_impuesto_id,
                        'tasa', v_tasa,
                        'monto', ROUND(v_monto_acumulado + v_monto_impuesto, 2)
                    ),
                    true
                );
            END LOOP;
        END IF;

        INSERT INTO facturas_lineas (
            factura_id,
            descripcion,
            cantidad,
            precio_unitario,
            impuestos
        )
        VALUES (
            v_factura_id,
            v_linea->>'descripcion',
            v_cantidad,
            v_precio,
            v_linea_impuestos
        );
    END LOOP;

    IF v_impuestos_map <> '{}'::JSONB THEN
        SELECT jsonb_agg(value ORDER BY key)
        INTO v_impuestos_json
        FROM jsonb_each(v_impuestos_map);
    END IF;

    UPDATE facturas
    SET subtotal = ROUND(v_subtotal, 2),
        total = ROUND(v_subtotal + v_impuestos_total, 2),
        impuestos = v_impuestos_json
    WHERE factura_id = v_factura_id;

    UPDATE pedidos
    SET estado = 'FACTURADO',
        updated_at = now()
    WHERE pedido_id = v_pedido.pedido_id;

    INSERT INTO transacciones (tipo, referencia_id, descripcion, datos, created_by)
    VALUES (
        'FACTURA_VENTA',
        v_factura_id,
        format('Factura %s emitida para pedido %s', v_numero, v_pedido.pedido_id),
        jsonb_build_object(
            'facturaId', v_factura_id,
            'pedidoId', v_pedido.pedido_id,
            'numero', v_numero,
            'fechaEmision', v_fecha,
            'moneda', v_moneda,
            'subtotal', ROUND(v_subtotal, 2),
            'total', ROUND(v_subtotal + v_impuestos_total, 2),
            'impuestos', v_impuestos_json,
            'lineas', payload->'lineas'
        ),
        v_usuario
    );

    RETURN v_factura_id;
END;
$$;
