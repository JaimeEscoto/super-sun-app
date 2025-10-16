CREATE SEQUENCE IF NOT EXISTS orden_compra_numero_seq START WITH 1 INCREMENT BY 1;

ALTER TABLE ordenes_compra
  ADD COLUMN IF NOT EXISTS numero VARCHAR(30);

ALTER TABLE ordenes_compra
  ALTER COLUMN estado SET DEFAULT 'PENDIENTE';

UPDATE ordenes_compra
SET numero = COALESCE(
  numero,
  'OC-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || LPAD(nextval('orden_compra_numero_seq')::TEXT, 5, '0')
);

UPDATE ordenes_compra
SET estado = 'PENDIENTE'
WHERE estado = 'BORRADOR';

CREATE UNIQUE INDEX IF NOT EXISTS ordenes_compra_numero_idx
  ON ordenes_compra (numero)
  WHERE numero IS NOT NULL;
