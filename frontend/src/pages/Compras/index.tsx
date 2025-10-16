import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { Column, DataTable } from '@/components/cards/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { SAPDocumentCard } from '@/components/sap/SAPDocumentCard';
import api from '@/lib/api';

interface Supplier {
  id: string;
  nombre: string;
}

interface Product {
  id: string;
  sku: string;
  descripcion: string;
  precioBase: number;
}

interface Warehouse {
  id: string;
  nombre: string;
}

interface PurchaseOrderRow {
  id: string;
  numero: string | null;
  proveedor_id: string;
  proveedor_nombre: string;
  fecha: string;
  estado: string;
  moneda: string;
  total: string;
  impuestos: string;
}

type PurchaseLineState = {
  id: string;
  productoId: string;
  cantidad: string;
  precio: string;
  taxRate: number;
};

interface InventoryValuation {
  producto_id: string;
  existencias: string;
  valor_total: string;
}

type PurchaseOrderRequest = {
  proveedorId: string;
  fecha: string;
  moneda: string;
  condicionesPago: string;
  estado: string;
  lineas: Array<{ productoId: string; cantidad: number; precio: number; impuestos: number[] }>;
};

type ReceiptLineState = {
  id: string;
  productoId: string;
  cantidad: string;
  costo: string;
};

const buildId = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));

export const ComprasPage = () => {
  const queryClient = useQueryClient();
  const [orderStatus, setOrderStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [receiptStatus, setReceiptStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [purchaseForm, setPurchaseForm] = useState({
    proveedorId: '',
    fecha: new Date().toISOString().slice(0, 10),
    moneda: 'HNL',
    condicionesPago: '30 días'
  });
  const [purchaseLines, setPurchaseLines] = useState<PurchaseLineState[]>([]);
  const [productFilter, setProductFilter] = useState('');
  const [receiptForm, setReceiptForm] = useState({
    ocId: '',
    fecha: new Date().toISOString().slice(0, 10),
    almacenId: ''
  });
  const [receiptLines, setReceiptLines] = useState<ReceiptLineState[]>([]);

  const { data: proveedores } = useQuery({
    queryKey: ['catalogos', 'proveedores'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Supplier[] }>('/catalogos/proveedores', {
        params: { page: 1, pageSize: 50 }
      });
      return data.data;
    }
  });

  const { data: productos } = useQuery({
    queryKey: ['catalogos', 'productos'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Product[] }>('/catalogos/productos', {
        params: { page: 1, pageSize: 100 }
      });
      return data.data;
    }
  });

  const { data: valuaciones } = useQuery({
    queryKey: ['inventario', 'valuacion'],
    queryFn: async () => {
      const { data } = await api.get<{ data: InventoryValuation[] }>('/inventario/valuacion');
      return data.data;
    }
  });

  const { data: almacenes } = useQuery({
    queryKey: ['catalogos', 'almacenes'],
    queryFn: async () => {
      const { data } = await api.get<{ data: Warehouse[] }>('/catalogos/almacenes', {
        params: { page: 1, pageSize: 25 }
      });
      return data.data;
    }
  });

  const { data: ordenes } = useQuery({
    queryKey: ['compras', 'ordenes'],
    queryFn: async () => {
      const response = await api.get<{ data: PurchaseOrderRow[] }>('/compras/ordenes');
      return response.data.data;
    }
  });

  useEffect(() => {
    if (!proveedores?.length) {
      return;
    }
    setPurchaseForm((prev) => ({ ...prev, proveedorId: prev.proveedorId || proveedores[0].id }));
  }, [proveedores]);

  useEffect(() => {
    if (!productos?.length) {
      return;
    }

    setPurchaseLines((prev) =>
      prev.length > 0
        ? prev
        : [
            {
              id: buildId(),
              productoId: productos[0].id,
              cantidad: '1',
              precio: productos[0].precioBase.toString(),
              taxRate: 15
            }
          ]
    );

    setReceiptLines((prev) =>
      prev.length > 0
        ? prev
        : [
            {
              id: buildId(),
              productoId: productos[0].id,
              cantidad: '1',
              costo: productos[0].precioBase.toString()
            }
          ]
    );
  }, [productos]);

  useEffect(() => {
    if (!almacenes?.length) {
      return;
    }
    setReceiptForm((prev) => ({ ...prev, almacenId: prev.almacenId || almacenes[0].id }));
  }, [almacenes]);

  useEffect(() => {
    if (!ordenes?.length) {
      return;
    }
    setReceiptForm((prev) => ({ ...prev, ocId: prev.ocId || ordenes[0].id }));
  }, [ordenes]);

  const purchaseMutation = useMutation<{ orden: PurchaseOrderRow }, unknown, PurchaseOrderRequest>({
    mutationFn: async (payload) => {
      const { data } = await api.post<{ orden: PurchaseOrderRow }>('/compras/ordenes', payload);
      return data;
    },
    onSuccess: (response) => {
      const numeroGenerado = response.orden.numero ?? response.orden.id;
      setOrderNumber(numeroGenerado);
      const total = Number(response.orden.total);
      const totalLabel = Number.isFinite(total) ? total.toFixed(2) : response.orden.total;
      setOrderStatus({
        type: 'success',
        message: `Orden ${numeroGenerado} guardada como ${response.orden.estado}. Total: L ${totalLabel}`
      });
      queryClient.invalidateQueries({ queryKey: ['compras', 'ordenes'] });
    },
    onError: (error) => {
      const message =
        (axios.isAxiosError(error) && error.response?.data?.message) || 'No se pudo crear la orden de compra.';
      setOrderStatus({ type: 'error', message });
    }
  });

  const receiptMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ocId: receiptForm.ocId || undefined,
        fecha: receiptForm.fecha,
        almacenId: receiptForm.almacenId,
        lineas: receiptLines.map((linea) => ({
          productoId: linea.productoId,
          cantidad: Number(linea.cantidad) || 0,
          costo: Number(linea.costo) || 0
        }))
      };

      const { data } = await api.post('/compras/recepciones', payload);
      return data;
    },
    onSuccess: () => {
      setReceiptStatus({
        type: 'success',
        message: 'Recepción registrada. Stock actualizado y transacción generada.'
      });
      queryClient.invalidateQueries({ queryKey: ['inventario', 'valuacion'] });
    },
    onError: (error) => {
      const message =
        (axios.isAxiosError(error) && error.response?.data?.message) || 'No se pudo registrar la recepción.';
      setReceiptStatus({ type: 'error', message });
    }
  });

  const purchaseTotals = useMemo(
    () =>
      purchaseLines.reduce(
        (totals, linea) => {
          const quantity = Number(linea.cantidad) || 0;
          const price = Number(linea.precio) || 0;
          const lineSubtotal = quantity * price;
          const lineTax = lineSubtotal * (linea.taxRate / 100);
          return {
            subtotal: totals.subtotal + lineSubtotal,
            impuestos: totals.impuestos + lineTax,
            total: totals.total + lineSubtotal + lineTax
          };
        },
        { subtotal: 0, impuestos: 0, total: 0 }
      ),
    [purchaseLines]
  );

  const productsById = useMemo(() => {
    const map = new Map<string, Product>();
    productos?.forEach((producto) => {
      map.set(producto.id, producto);
    });
    return map;
  }, [productos]);

  const valuationsByProduct = useMemo(() => {
    const map = new Map<string, number>();
    valuaciones?.forEach((row) => {
      map.set(row.producto_id, Number(row.existencias) || 0);
    });
    return map;
  }, [valuaciones]);

  const filteredProducts = useMemo(() => {
    if (!productos) {
      return [] as Product[];
    }

    const term = productFilter.trim().toLowerCase();
    if (!term) {
      return productos;
    }

    return productos.filter((producto) =>
      producto.descripcion.toLowerCase().includes(term) || producto.sku.toLowerCase().includes(term)
    );
  }, [productFilter, productos]);

  type InventoryValidationResult = {
    level: 'ok' | 'warning' | 'info' | 'error';
    message: string;
    available: number | null;
  };

  const inventoryValidation = useMemo(() => {
    const map = new Map<string, InventoryValidationResult>();

    purchaseLines.forEach((linea) => {
      const quantity = Number(linea.cantidad) || 0;
      if (!linea.productoId) {
        map.set(linea.id, {
          level: 'error',
          message: 'Selecciona un producto para la línea.',
          available: null
        });
        return;
      }

      if (quantity <= 0) {
        map.set(linea.id, {
          level: 'error',
          message: 'La cantidad debe ser mayor a cero.',
          available: valuationsByProduct.get(linea.productoId) ?? null
        });
        return;
      }

      const available = valuationsByProduct.get(linea.productoId);
      if (available === undefined) {
        map.set(linea.id, {
          level: 'info',
          message: 'Sin datos de inventario para este producto. Se solicitará reabastecimiento.',
          available: null
        });
        return;
      }

      if (available >= quantity) {
        map.set(linea.id, {
          level: 'warning',
          message: `El inventario actual (${available.toFixed(2)} u.) cubre la cantidad solicitada. Confirma si deseas reponer.`,
          available
        });
        return;
      }

      map.set(linea.id, {
        level: 'ok',
        message: `Faltan ${(quantity - available).toFixed(2)} u. en inventario.`,
        available
      });
    });

    return map;
  }, [purchaseLines, valuationsByProduct]);

  const receiptTotals = useMemo(() =>
    receiptLines.reduce((acc, linea) => acc + (Number(linea.cantidad) || 0) * (Number(linea.costo) || 0), 0),
  [receiptLines]);

  const columns: Column<PurchaseOrderRow>[] = [
    {
      header: 'Pedido',
      accessor: 'numero',
      render: (value, row) => (value ? (value as string) : row.id)
    },
    { header: 'Proveedor', accessor: 'proveedor_nombre' },
    { header: 'Fecha', accessor: 'fecha' },
    { header: 'Estado', accessor: 'estado' },
    { header: 'Moneda', accessor: 'moneda' },
    {
      header: 'Subtotal',
      accessor: 'impuestos',
      render: (_value, row) => `L ${(Number(row.total) - Number(row.impuestos)).toFixed(2)}`
    },
    {
      header: 'Total',
      accessor: 'total',
      render: (value) => `L ${Number(value).toFixed(2)}`
    }
  ];

  const handlePurchaseLineChange = (id: string, field: keyof PurchaseLineState, value: string) => {
    setPurchaseLines((prev) =>
      prev.map((linea) =>
        linea.id === id
          ? {
              ...linea,
              [field]: value
            }
          : linea
      )
    );
  };

  const handleReceiptLineChange = (id: string, field: keyof ReceiptLineState, value: string) => {
    setReceiptLines((prev) =>
      prev.map((linea) =>
        linea.id === id
          ? {
              ...linea,
              [field]: value
            }
          : linea
      )
    );
  };

  const handlePurchaseProductChange = (id: string, productoId: string) => {
    const precio = productsById.get(productoId)?.precioBase ?? 0;
    handlePurchaseLineChange(id, 'productoId', productoId);
    handlePurchaseLineChange(id, 'precio', precio.toString());
  };

  const handleReceiptProductChange = (id: string, productoId: string) => {
    const costo = productos?.find((producto) => producto.id === productoId)?.precioBase ?? 0;
    handleReceiptLineChange(id, 'productoId', productoId);
    handleReceiptLineChange(id, 'costo', costo.toString());
  };

  const resetOrderForm = () => {
    if (!proveedores?.length || !productos?.length) {
      return;
    }
    setOrderStatus(null);
    setOrderNumber(null);
    setProductFilter('');
    setPurchaseForm({
      proveedorId: proveedores[0].id,
      fecha: new Date().toISOString().slice(0, 10),
      moneda: 'HNL',
      condicionesPago: '30 días'
    });
    setPurchaseLines([
      {
        id: buildId(),
        productoId: productos[0].id,
        cantidad: '1',
        precio: productos[0].precioBase.toString(),
        taxRate: 15
      }
    ]);
  };

  const resetReceiptForm = () => {
    if (!productos?.length || !almacenes?.length) {
      return;
    }
    setReceiptStatus(null);
    setReceiptForm({
      ocId: ordenes?.[0]?.id ?? '',
      fecha: new Date().toISOString().slice(0, 10),
      almacenId: almacenes[0].id
    });
    setReceiptLines([
      {
        id: buildId(),
        productoId: productos[0].id,
        cantidad: '1',
        costo: productos[0].precioBase.toString()
      }
    ]);
  };

  const getProductOptions = (selectedId: string) => {
    const source = productFilter.trim() ? filteredProducts : productos ?? [];

    if (selectedId && !source.some((producto) => producto.id === selectedId)) {
      const selected = productsById.get(selectedId);
      if (selected) {
        return [selected, ...source];
      }
    }

    return source;
  };

  const getValidationMessageColor = (validation: InventoryValidationResult | undefined) => {
    switch (validation?.level) {
      case 'error':
        return 'text-rose-600';
      case 'warning':
        return 'text-amber-600';
      case 'info':
        return 'text-sky-600';
      case 'ok':
        return 'text-emerald-600';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Abastecimiento inspirado en SAP Business One"
        description="Ejecuta órdenes de compra y recepciones con paneles alineados al flujo clásico de SAP B1, integrando aprobación, costos y actualización de inventario."
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr,1fr]">
        <div className="space-y-6">
          <SAPDocumentCard
            title="Orden de compra"
            subtitle="Documento base con partidas, moneda y condiciones financieras."
            documentCode="A/P PURCHASE ORDER"
            status={orderStatus}
            onReset={resetOrderForm}
          >
            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                setOrderStatus(null);

                if (!purchaseForm.proveedorId) {
                  setOrderStatus({ type: 'error', message: 'Selecciona un proveedor antes de guardar.' });
                  return;
                }

                if (!purchaseForm.fecha) {
                  setOrderStatus({ type: 'error', message: 'Define la fecha del pedido.' });
                  return;
                }

                if (!purchaseLines.length) {
                  setOrderStatus({ type: 'error', message: 'Agrega al menos un producto al pedido.' });
                  return;
                }

                const sanitizedLines = purchaseLines.map((linea) => ({
                  productoId: linea.productoId,
                  cantidad: Number(linea.cantidad) || 0,
                  precio: Number(linea.precio) || 0,
                  impuestos: linea.taxRate > 0 ? [linea.taxRate] : []
                }));

                if (
                  sanitizedLines.some(
                    (linea) => !linea.productoId || linea.cantidad <= 0 || linea.precio <= 0
                  )
                ) {
                  setOrderStatus({
                    type: 'error',
                    message: 'Verifica que cada partida tenga producto, cantidad y precio mayores a cero.'
                  });
                  return;
                }

                const hasBlockingInventoryIssues = purchaseLines.some(
                  (linea) => inventoryValidation.get(linea.id)?.level === 'error'
                );

                if (hasBlockingInventoryIssues) {
                  setOrderStatus({
                    type: 'error',
                    message: 'Corrige las cantidades marcadas en rojo antes de guardar.'
                  });
                  return;
                }

                const payload: PurchaseOrderRequest = {
                  proveedorId: purchaseForm.proveedorId,
                  fecha: purchaseForm.fecha,
                  moneda: purchaseForm.moneda,
                  condicionesPago: purchaseForm.condicionesPago,
                  estado: 'PENDIENTE',
                  lineas: sanitizedLines
                };

                purchaseMutation.mutate(payload);
              }}
              className="space-y-8"
            >
              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-1 text-sm text-slate-600">
                    <span>Número de pedido</span>
                    <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700">
                      {orderNumber ?? 'Se generará al guardar'}
                    </p>
                  </div>
                  <label className="space-y-1 text-sm text-slate-600">
                    Fecha
                    <input
                      type="date"
                      value={purchaseForm.fecha}
                      onChange={(event) => setPurchaseForm((prev) => ({ ...prev, fecha: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    Proveedor
                    <select
                      value={purchaseForm.proveedorId}
                      onChange={(event) => setPurchaseForm((prev) => ({ ...prev, proveedorId: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      {proveedores?.map((proveedor) => (
                        <option key={proveedor.id} value={proveedor.id}>
                          {proveedor.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    Moneda
                    <select
                      value={purchaseForm.moneda}
                      onChange={(event) => setPurchaseForm((prev) => ({ ...prev, moneda: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="HNL">HNL</option>
                      <option value="USD">USD</option>
                    </select>
                  </label>
                </div>
                <label className="mt-4 block text-sm text-slate-600">
                  <span>Condiciones de pago</span>
                  <input
                    type="text"
                    value={purchaseForm.condicionesPago}
                    onChange={(event) =>
                      setPurchaseForm((prev) => ({ ...prev, condicionesPago: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Ej. Contado, 30 días"
                  />
                </label>
              </section>

              <section className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700">Partidas de la orden</h4>
                    <p className="text-xs text-slate-500">
                      Selecciona productos, valida existencias y confirma cantidades requeridas.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="search"
                      value={productFilter}
                      onChange={(event) => setProductFilter(event.target.value)}
                      placeholder="Buscar producto"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-48"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setPurchaseLines((prev) => [
                          ...prev,
                          {
                            id: buildId(),
                            productoId: productos?.[0]?.id ?? '',
                            cantidad: '1',
                            precio: productos?.[0]?.precioBase?.toString() ?? '0',
                            taxRate: 15
                          }
                        ])
                      }
                      disabled={!productos?.length}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <Plus size={14} />
                      Agregar producto
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] table-fixed border-separate border-spacing-y-2 text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="text-left">Producto</th>
                        <th className="w-28 text-right">Cantidad</th>
                        <th className="w-32 text-right">Precio unitario</th>
                        <th className="w-32 text-right">Subtotal</th>
                        <th className="w-12">&nbsp;</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseLines.map((linea) => {
                        const options = getProductOptions(linea.productoId);
                        const quantity = Number(linea.cantidad) || 0;
                        const price = Number(linea.precio) || 0;
                        const subtotal = quantity * price;
                        const taxAmount = subtotal * (linea.taxRate / 100);
                        const validation = inventoryValidation.get(linea.id);
                        const messageColor = getValidationMessageColor(validation);
                        const inputBorder =
                          validation?.level === 'error'
                            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
                            : 'border-slate-200 focus:border-primary focus:ring-primary/20';
                        const availableStock = validation?.available;
                        const hasAvailableStock = availableStock != null;

                        return (
                          <tr key={linea.id} className="bg-white">
                            <td className="rounded-l-xl border border-slate-200 px-3 py-2 align-top">
                              <select
                                value={linea.productoId}
                                onChange={(event) => handlePurchaseProductChange(linea.id, event.target.value)}
                                className={`w-full rounded-md bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 ${inputBorder}`}
                              >
                                <option value="" disabled>
                                  Selecciona un producto
                                </option>
                                {options.map((producto) => (
                                  <option key={producto.id} value={producto.id}>
                                    {producto.descripcion} ({producto.sku})
                                  </option>
                                ))}
                              </select>
                              {validation ? (
                                <p className={`mt-2 flex items-start gap-1 text-xs ${messageColor}`}>
                                  {validation.level !== 'ok' ? <AlertTriangle size={12} className="mt-0.5" /> : null}
                                  <span>{validation.message}</span>
                                </p>
                              ) : null}
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-right align-top">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={linea.cantidad}
                                onChange={(event) => handlePurchaseLineChange(linea.id, 'cantidad', event.target.value)}
                                className={`w-full rounded-md px-2 py-1 text-right focus:outline-none focus:ring-2 ${inputBorder}`}
                              />
                              {hasAvailableStock ? (
                                <p className="mt-1 text-xs text-slate-500">
                                  Stock: {availableStock.toFixed(2)} u.
                                </p>
                              ) : null}
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-right align-top">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={linea.precio}
                                onChange={(event) => handlePurchaseLineChange(linea.id, 'precio', event.target.value)}
                                className="w-full rounded-md border border-slate-200 px-2 py-1 text-right focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                              <p className="mt-1 text-xs text-slate-500">Imp. {linea.taxRate}%</p>
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-right align-top">
                              <div className="font-semibold text-slate-800">L {subtotal.toFixed(2)}</div>
                              <p className="text-xs text-slate-500">Impuesto: L {taxAmount.toFixed(2)}</p>
                            </td>
                            <td className="rounded-r-xl border border-slate-200 px-2 text-center align-top">
                              <button
                                type="button"
                                onClick={() =>
                                  setPurchaseLines((prev) =>
                                    prev.length === 1 ? prev : prev.filter((item) => item.id !== linea.id)
                                  )
                                }
                                className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-slate-400 transition hover:text-rose-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <footer className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Resumen del pedido</h4>
                  <dl className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <dt>Subtotal</dt>
                      <dd className="font-medium">L {purchaseTotals.subtotal.toFixed(2)}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt>Impuestos</dt>
                      <dd className="font-medium">L {purchaseTotals.impuestos.toFixed(2)}</dd>
                    </div>
                    <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                      <dt>Total</dt>
                      <dd>L {purchaseTotals.total.toFixed(2)}</dd>
                    </div>
                  </dl>
                </div>

                {purchaseLines
                  .map((linea) => inventoryValidation.get(linea.id))
                  .filter((state) => state && (state.level === 'warning' || state.level === 'info'))
                  .map((state, index) => (
                    <div
                      key={`${state?.message}-${index}`}
                      className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700"
                    >
                      <AlertTriangle size={12} className="mt-0.5" />
                      <span>{state?.message}</span>
                    </div>
                  ))}

                <div className="flex flex-col gap-3 text-sm md:flex-row md:items-center md:justify-end">
                  <button
                    type="button"
                    onClick={resetOrderForm}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:border-slate-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={purchaseMutation.isPending}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:bg-slate-300"
                  >
                    {purchaseMutation.isPending ? 'Guardando…' : 'Guardar pedido'}
                  </button>
                </div>
              </footer>
            </form>
          </SAPDocumentCard>

          <SAPDocumentCard
            title="Recepción de mercancía"
            subtitle="Ingreso a bodega con ajuste de inventario y bitácora de costos."
            documentCode="GOODS RECEIPT PO"
            status={receiptStatus}
            onReset={resetReceiptForm}
          >
            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                setReceiptStatus(null);
                receiptMutation.mutate();
              }}
              className="space-y-6"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-1 text-sm text-slate-600">
                  Orden de compra
                  <select
                    value={receiptForm.ocId}
                    onChange={(event) => setReceiptForm((prev) => ({ ...prev, ocId: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Recepción directa</option>
                    {ordenes?.map((orden) => (
                      <option key={orden.id} value={orden.id}>
                        {orden.numero ?? orden.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm text-slate-600">
                  Almacén destino
                  <select
                    value={receiptForm.almacenId}
                    onChange={(event) => setReceiptForm((prev) => ({ ...prev, almacenId: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    {almacenes?.map((almacen) => (
                      <option key={almacen.id} value={almacen.id}>
                        {almacen.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm text-slate-600">
                  Fecha de recepción
                  <input
                    type="date"
                    value={receiptForm.fecha}
                    onChange={(event) => setReceiptForm((prev) => ({ ...prev, fecha: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Partidas recibidas</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setReceiptLines((prev) => [
                        ...prev,
                        {
                          id: buildId(),
                          productoId: productos?.[0]?.id ?? '',
                          cantidad: '1',
                          costo: productos?.[0]?.precioBase?.toString() ?? '0'
                        }
                      ])
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    <Plus size={14} />
                    Agregar línea
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-y-2 text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="text-left">Artículo</th>
                        <th className="w-24 text-right">Cantidad</th>
                        <th className="w-32 text-right">Costo</th>
                        <th className="w-12">&nbsp;</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptLines.map((linea) => {
                        const options = getProductOptions(linea.productoId);

                        return (
                          <tr key={linea.id} className="bg-white">
                            <td className="rounded-l-xl border border-slate-200 px-3 py-2">
                              <select
                                value={linea.productoId}
                                onChange={(event) => handleReceiptProductChange(linea.id, event.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                              >
                                {options.map((producto) => (
                                  <option key={producto.id} value={producto.id}>
                                    {producto.descripcion} ({producto.sku})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={linea.cantidad}
                                onChange={(event) => handleReceiptLineChange(linea.id, 'cantidad', event.target.value)}
                                className="w-full rounded-md border border-slate-200 px-2 py-1 text-right"
                              />
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={linea.costo}
                                onChange={(event) => handleReceiptLineChange(linea.id, 'costo', event.target.value)}
                                className="w-full rounded-md border border-slate-200 px-2 py-1 text-right"
                              />
                            </td>
                            <td className="rounded-r-xl border border-slate-200 px-2 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setReceiptLines((prev) =>
                                    prev.length === 1 ? prev : prev.filter((item) => item.id !== linea.id)
                                  )
                                }
                                className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <footer className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
                <p>
                  Valor recibido: <strong>L {receiptTotals.toFixed(2)}</strong>
                </p>
                <button
                  type="submit"
                  disabled={receiptMutation.isPending}
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:bg-slate-300"
                >
                  {receiptMutation.isPending ? 'Registrando…' : 'Registrar recepción'}
                </button>
              </footer>
            </form>
          </SAPDocumentCard>
        </div>

        <div className="space-y-6">
          <DataTable<PurchaseOrderRow>
            title="Órdenes de compra recientes"
            data={ordenes ?? []}
            columns={columns}
          />
          <div className="card space-y-3 p-6 text-sm text-slate-600">
            <h3 className="text-lg font-semibold text-slate-900">Flujo SAP Business One</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Orden de compra con aprobación por monto y proveedor.</li>
              <li>Recepción de mercancía actualiza inventario y costos promedio.</li>
              <li>Factura de proveedor enlaza retenciones e impuestos ISV.</li>
              <li>Asiento contable automático para la recepción y la factura.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
