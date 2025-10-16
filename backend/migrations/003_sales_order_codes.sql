-- Migration: add human-readable sales order codes
CREATE SEQUENCE IF NOT EXISTS pedido_codigo_seq;

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS codigo TEXT;

-- Populate existing records with sequential codes ordered by fecha and creation timestamp
WITH ordered AS (
  SELECT
    pedido_id,
    fecha,
    row_number() OVER (ORDER BY fecha, created_at, pedido_id) AS seq
  FROM pedidos
)
UPDATE pedidos p
SET codigo = format('SO-%s-%04s', to_char(p.fecha, 'YYYY'), lpad(ordered.seq::text, 4, '0'))
FROM ordered
WHERE ordered.pedido_id = p.pedido_id
  AND p.codigo IS NULL;

-- Ensure the sequence continues after the highest assigned code
WITH last_seq AS (
  SELECT MAX((regexp_replace(codigo, '^.+-(\\d+)$', '\\1'))::BIGINT) AS max_seq
  FROM pedidos
  WHERE codigo ~ '^SO-\\d{4}-\\d{4}$'
)
SELECT setval(
  'pedido_codigo_seq',
  COALESCE(last_seq.max_seq, 1),
  last_seq.max_seq IS NOT NULL
)
FROM last_seq;

ALTER TABLE pedidos
  ALTER COLUMN codigo SET NOT NULL,
  ADD CONSTRAINT pedidos_codigo_unique UNIQUE (codigo);

-- Helper function to generate formatted codes using the shared sequence
CREATE OR REPLACE FUNCTION generar_codigo_pedido(p_fecha DATE)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_seq BIGINT;
BEGIN
  v_seq := nextval('pedido_codigo_seq');
  RETURN format('SO-%s-%04s', to_char(p_fecha, 'YYYY'), lpad(v_seq::text, 4, '0'));
END;
$$;

-- Trigger that assigns codes automatically before inserting new rows
CREATE OR REPLACE FUNCTION set_pedido_codigo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := generar_codigo_pedido(COALESCE(NEW.fecha, CURRENT_DATE));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_pedido_codigo ON pedidos;

CREATE TRIGGER trg_set_pedido_codigo
BEFORE INSERT ON pedidos
FOR EACH ROW
EXECUTE FUNCTION set_pedido_codigo();
