-- Documentos de prueba para compras, ventas y facturación
-- Cada sección inserta 5 registros de ejemplo con datos alineados a los catálogos del ERP.

-- Órdenes de compra
INSERT INTO compras_ordenes (id, proveedor_id, fecha, estado, moneda, total)
VALUES
  ('OC-2024-001', 'PROV-HN-001', '2024-07-01', 'APROBADA', 'HNL', 45890.50),
  ('OC-2024-002', 'PROV-HN-014', '2024-07-02', 'EN_RECEPCION', 'HNL', 18900.00),
  ('OC-2024-003', 'PROV-US-003', '2024-07-04', 'PENDIENTE', 'USD', 7250.75),
  ('OC-2024-004', 'PROV-HN-099', '2024-07-05', 'CERRADA', 'HNL', 3200.00),
  ('OC-2024-005', 'PROV-HN-052', '2024-07-06', 'APROBADA', 'HNL', 12540.30);

-- Pedidos de venta
INSERT INTO ventas_pedidos (id, cliente_id, fecha, estado, moneda, total)
VALUES
  ('PED-2024-301', 'CLI-HN-104', '2024-07-01', 'CONFIRMADO', 'HNL', 25000.00),
  ('PED-2024-302', 'CLI-HN-221', '2024-07-02', 'PENDIENTE_DESPACHO', 'HNL', 12890.50),
  ('PED-2024-303', 'CLI-ES-015', '2024-07-03', 'FACTURADO', 'USD', 8420.90),
  ('PED-2024-304', 'CLI-HN-310', '2024-07-04', 'COTIZADO', 'HNL', 5600.00),
  ('PED-2024-305', 'CLI-HN-017', '2024-07-05', 'CONFIRMADO', 'HNL', 1890.75);

-- Facturas electrónicas
INSERT INTO facturacion_facturas (id, numero, cliente_id, fecha_emision, moneda, total, estado)
VALUES
  ('FAC-2024-801', 'CAI-001-00000001', 'CLI-HN-104', '2024-07-01', 'HNL', 28750.00, 'AUTORIZADA'),
  ('FAC-2024-802', 'CAI-001-00000002', 'CLI-HN-221', '2024-07-02', 'HNL', 15200.35, 'AUTORIZADA'),
  ('FAC-2024-803', 'CAI-001-00000003', 'CLI-ES-015', '2024-07-03', 'USD', 8990.20, 'ENVIADA_SAR'),
  ('FAC-2024-804', 'CAI-001-00000004', 'CLI-HN-310', '2024-07-04', 'HNL', 6725.15, 'PENDIENTE'),
  ('FAC-2024-805', 'CAI-001-00000005', 'CLI-HN-017', '2024-07-05', 'HNL', 2100.00, 'AUTORIZADA');
