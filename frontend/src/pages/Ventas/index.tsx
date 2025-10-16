import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { Column, DataTable } from '@/components/cards/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import api from '@/lib/api';
import { SAPDocumentCard } from '@/components/sap/SAPDocumentCard';

interface CatalogClient {
  id: string;
  razonSocial: string;
  limiteCredito: number;
  saldo: number;
}

interface CatalogProduct {
  id: string;
  descripcion: string;
  precioBase: number;
}

interface Warehouse {
  id: string;
  nombre: string;
}

interface SalesOrderRow {
  id: string;
  codigo: string;
  cliente_id: string;
  clienteNombre: string;
  fecha: string;
  estado: string;
  total: string;
  moneda: string;
}

interface SalesOrderResponse {
  pedido_id: string;
  codigo: string;
}

interface DeliveryResponse {
  transaccionId: string;
}

interface InvoiceResponse {
  factura: { factura_id: string; numero: string };
}

type OrderLineState = {
  id: string;
  productoId: string;
  cantidad: string;
  precio: string;
  descuentos: string;
};

type DeliveryLineState = {
  id: string;
  productoId: string;
  cantidad: string;
  costoUnitario: string;
};

type InvoiceLineState = {
  id: string;
  descripcion: string;
  cantidad: string;
  precioUnitario: string;
};

const buildId = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));

type WorkflowType = 'pedido' | 'entrega' | 'factura';

export const VentasPage = () => {
  const queryClient = useQueryClient();
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowType>('pedido');
  const [orderForm, setOrderForm] = useState({
    clienteId: '',
    fecha: new Date().toISOString().slice(0, 10),
    moneda: 'HNL',
    condicionesPago: 'Contado'
  });
  const [orderLines, setOrderLines] = useState<OrderLineState[]>([]);
  const [deliveryForm, setDeliveryForm] = useState({
    pedidoId: '',
    fecha: new Date().toISOString().slice(0, 10),
    almacenId: ''
  });
  const [deliveryLines, setDeliveryLines] = useState<DeliveryLineState[]>([]);
  const [invoiceForm, setInvoiceForm] = useState({
    pedidoId: '',
    fechaEmision: new Date().toISOString().slice(0, 10),
    moneda: 'HNL',
    tipoComprobante: 'FACTURA'
  });
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLineState[]>([]);
  const [orderStatus, setOrderStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [invoiceStatus, setInvoiceStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const workflowOptions: Array<{ id: WorkflowType; label: string; description: string }> = [
    {
      id: 'pedido',
      label: 'Pedido',
      description: 'Registrar la orden de venta y validar condiciones comerciales.'
    },
    {
      id: 'entrega',
      label: 'Entrega',
      description: 'Despachar mercancía y actualizar el inventario disponible.'
    },
    {
      id: 'factura',
      label: 'Factura',
      description: 'Emitir el comprobante fiscal para el pedido seleccionado.'
    }
  ];

  const { data: clientes } = useQuery({
    queryKey: ['catalogos', 'clientes'],
    queryFn: async () => {
      const { data } = await api.get<{ data: CatalogClient[] }>('/catalogos/clientes', {
        params: { page: 1, pageSize: 50 }
      });
      return data.data;
    }
  });

  const { data: productos } = useQuery({
    queryKey: ['catalogos', 'productos'],
    queryFn: async () => {
      const { data } = await api.get<{ data: CatalogProduct[] }>('/catalogos/productos', {
        params: { page: 1, pageSize: 100 }
      });
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

  const { data: pedidos } = useQuery({
    queryKey: ['ventas', 'pedidos'],
    queryFn: async () => {
      const response = await api.get<{ data: SalesOrderRow[] }>('/ventas/pedidos');
      return response.data.data;
    }
  });

  useEffect(() => {
    if (!clientes?.length) {
      return;
    }
    setOrderForm((prev) => ({ ...prev, clienteId: prev.clienteId || clientes[0].id }));
  }, [clientes]);

  useEffect(() => {
    if (!productos?.length) {
      return;
    }

    setOrderLines((prev) =>
      prev.length > 0
        ? prev
        : [
            {
              id: buildId(),
              productoId: productos[0].id,
              cantidad: '1',
              precio: productos[0].precioBase.toString(),
              descuentos: '0'
            }
          ]
    );

    setDeliveryLines((prev) =>
      prev.length > 0
        ? prev
        : [
            {
              id: buildId(),
              productoId: productos[0].id,
              cantidad: '1',
              costoUnitario: productos[0].precioBase.toString()
            }
          ]
    );

    setInvoiceLines((prev) =>
      prev.length > 0
        ? prev
        : [
            {
              id: buildId(),
              descripcion: productos[0].descripcion,
              cantidad: '1',
              precioUnitario: productos[0].precioBase.toString()
            }
          ]
    );
  }, [productos]);

  useEffect(() => {
    if (!almacenes?.length) {
      return;
    }
    setDeliveryForm((prev) => ({ ...prev, almacenId: prev.almacenId || almacenes[0].id }));
  }, [almacenes]);

  useEffect(() => {
    if (!pedidos?.length) {
      return;
    }
    setDeliveryForm((prev) => ({ ...prev, pedidoId: prev.pedidoId || pedidos[0].id }));
    setInvoiceForm((prev) => ({ ...prev, pedidoId: prev.pedidoId || pedidos[0].id }));
  }, [pedidos]);

  const orderMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        clienteId: orderForm.clienteId,
        fecha: orderForm.fecha,
        moneda: orderForm.moneda,
        condicionesPago: orderForm.condicionesPago,
        lineas: orderLines.map((linea) => ({
          productoId: linea.productoId,
          cantidad: Number(linea.cantidad) || 0,
          precio: Number(linea.precio) || 0,
          descuentos: Number(linea.descuentos) || 0
        }))
      };

      const { data } = await api.post<{ pedido: SalesOrderResponse }>('/ventas/pedidos', payload);
      return data.pedido;
    },
    onSuccess: (pedido) => {
      setOrderStatus({
        type: 'success',
        message: `Pedido ${pedido.codigo} registrado y listo para seguimiento logístico.`
      });
      queryClient.invalidateQueries({ queryKey: ['ventas', 'pedidos'] });
    },
    onError: (error) => {
      const message =
        (axios.isAxiosError(error) && error.response?.data?.message) || 'No fue posible crear el pedido.';
      setOrderStatus({ type: 'error', message });
    }
  });

  const deliveryMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        pedidoId: deliveryForm.pedidoId || undefined,
        fecha: deliveryForm.fecha,
        almacenId: deliveryForm.almacenId,
        lineas: deliveryLines.map((linea) => ({
          productoId: linea.productoId,
          cantidad: Number(linea.cantidad) || 0,
          costoUnitario: Number(linea.costoUnitario) || undefined
        }))
      };

      const { data } = await api.post<{ entrega: DeliveryResponse }>('/ventas/entregas', payload);
      return data.entrega;
    },
    onSuccess: (entrega) => {
      setDeliveryStatus({
        type: 'success',
        message: `Entrega aplicada. Transacción ${entrega.transaccionId} generada y stock ajustado.`
      });
      queryClient.invalidateQueries({ queryKey: ['inventario', 'valuacion'] });
    },
    onError: (error) => {
      const message =
        (axios.isAxiosError(error) && error.response?.data?.message) || 'No se pudo registrar la entrega.';
      setDeliveryStatus({ type: 'error', message });
    }
  });

  const invoiceMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        pedidoId: invoiceForm.pedidoId,
        fechaEmision: invoiceForm.fechaEmision,
        moneda: invoiceForm.moneda,
        tipoComprobante: invoiceForm.tipoComprobante,
        lineas: invoiceLines.map((linea) => ({
          descripcion: linea.descripcion,
          cantidad: Number(linea.cantidad) || 0,
          precioUnitario: Number(linea.precioUnitario) || 0,
          impuestos: []
        }))
      };

      const { data } = await api.post<InvoiceResponse>('/facturacion/facturas', payload);
      return data.factura;
    },
    onSuccess: (factura) => {
      setInvoiceStatus({
        type: 'success',
        message: `Factura ${factura.numero ?? factura.factura_id} emitida para envío al SAR.`
      });
    },
    onError: (error) => {
      const message =
        (axios.isAxiosError(error) && error.response?.data?.message) || 'No se pudo emitir la factura.';
      setInvoiceStatus({ type: 'error', message });
    }
  });

  const orderTotals = useMemo(() => {
    const subtotal = orderLines.reduce((acc, linea) => {
      const cantidad = Number(linea.cantidad) || 0;
      const precio = Number(linea.precio) || 0;
      const descuento = Number(linea.descuentos) || 0;
      return acc + cantidad * precio - descuento;
    }, 0);
    const isv = subtotal * 0.15;
    return {
      subtotal,
      isv,
      total: subtotal + isv
    };
  }, [orderLines]);

  const deliveryTotals = useMemo(() =>
    deliveryLines.reduce((acc, linea) => acc + (Number(linea.cantidad) || 0) * (Number(linea.costoUnitario) || 0), 0),
  [deliveryLines]);

  const invoiceTotals = useMemo(() =>
    invoiceLines.reduce((acc, linea) => acc + (Number(linea.cantidad) || 0) * (Number(linea.precioUnitario) || 0), 0),
  [invoiceLines]);

  const columns: Column<SalesOrderRow>[] = [
    { header: 'Pedido', accessor: 'codigo' },
    { header: 'Cliente', accessor: 'clienteNombre' },
    { header: 'Fecha', accessor: 'fecha' },
    { header: 'Estado', accessor: 'estado' },
    { header: 'Moneda', accessor: 'moneda' },
    {
      header: 'Total',
      accessor: 'total',
      render: (value, row) => {
        const amount = Number(value ?? 0);
        try {
          return amount.toLocaleString('es-HN', {
            style: 'currency',
            currency: row.moneda ?? 'HNL'
          });
        } catch {
          return amount.toFixed(2);
        }
      }
    }
  ];

  const handleOrderLineChange = (id: string, field: keyof OrderLineState, value: string) => {
    setOrderLines((prev) =>
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

  const handleDeliveryLineChange = (id: string, field: keyof DeliveryLineState, value: string) => {
    setDeliveryLines((prev) =>
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

  const handleInvoiceLineChange = (id: string, field: keyof InvoiceLineState, value: string) => {
    setInvoiceLines((prev) =>
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

  const renderProductOptions = productos?.map((producto) => (
    <option key={producto.id} value={producto.id}>
      {producto.descripcion}
    </option>
  ));

  const handleOrderProductChange = (id: string, productoId: string) => {
    const precio = productos?.find((producto) => producto.id === productoId)?.precioBase ?? 0;
    handleOrderLineChange(id, 'productoId', productoId);
    handleOrderLineChange(id, 'precio', precio.toString());
  };

  const handleDeliveryProductChange = (id: string, productoId: string) => {
    const costo = productos?.find((producto) => producto.id === productoId)?.precioBase ?? 0;
    handleDeliveryLineChange(id, 'productoId', productoId);
    handleDeliveryLineChange(id, 'costoUnitario', costo.toString());
  };

  const resetOrderForm = () => {
    if (!clientes?.length || !productos?.length) {
      return;
    }
    setOrderStatus(null);
    setOrderForm({
      clienteId: clientes[0].id,
      fecha: new Date().toISOString().slice(0, 10),
      moneda: 'HNL',
      condicionesPago: 'Contado'
    });
    setOrderLines([
      {
        id: buildId(),
        productoId: productos[0].id,
        cantidad: '1',
        precio: productos[0].precioBase.toString(),
        descuentos: '0'
      }
    ]);
  };

  const resetDeliveryForm = () => {
    if (!productos?.length || !almacenes?.length) {
      return;
    }
    setDeliveryStatus(null);
    setDeliveryForm({
      pedidoId: pedidos?.[0]?.id ?? '',
      fecha: new Date().toISOString().slice(0, 10),
      almacenId: almacenes[0].id
    });
    setDeliveryLines([
      {
        id: buildId(),
        productoId: productos[0].id,
        cantidad: '1',
        costoUnitario: productos[0].precioBase.toString()
      }
    ]);
  };

  const resetInvoiceForm = () => {
    setInvoiceStatus(null);
    setInvoiceForm({
      pedidoId: pedidos?.[0]?.id ?? '',
      fechaEmision: new Date().toISOString().slice(0, 10),
      moneda: 'HNL',
      tipoComprobante: 'FACTURA'
    });
    setInvoiceLines([
      {
        id: buildId(),
        descripcion: productos?.[0]?.descripcion ?? 'Servicio',
        cantidad: '1',
        precioUnitario: productos?.[0]?.precioBase?.toString() ?? '0'
      }
    ]);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ciclo comercial estilo SAP Business One"
        description="Gestiona pedidos, entregas y facturación con paneles inspirados en SAP B1: encabezado compacto, matriz de líneas y totales balanceados en una sola vista."
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Selecciona la transacción</h3>
                <p className="text-sm text-slate-500">Elige qué etapa del ciclo comercial deseas gestionar.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {workflowOptions.map((option) => {
                  const isActive = activeWorkflow === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setActiveWorkflow(option.id)}
                      className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-primary/60 hover:text-primary'
                      }`}
                      aria-pressed={isActive}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
              {workflowOptions.find((option) => option.id === activeWorkflow)?.description}
            </div>
          </div>

          {activeWorkflow === 'pedido' && (
            <SAPDocumentCard
              title="Pedido de venta"
              subtitle="Captura de documento con verificación de crédito y precios oficiales."
              documentCode="A/R SALES ORDER"
              status={orderStatus}
              onReset={resetOrderForm}
            >
              <form
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  setOrderStatus(null);
                  orderMutation.mutate();
                }}
                className="space-y-6"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-600">
                    Cliente
                    <select
                      value={orderForm.clienteId}
                      onChange={(event) => setOrderForm((prev) => ({ ...prev, clienteId: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      {clientes?.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.razonSocial}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    Fecha del documento
                    <input
                      type="date"
                      value={orderForm.fecha}
                      onChange={(event) => setOrderForm((prev) => ({ ...prev, fecha: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    Moneda
                    <select
                      value={orderForm.moneda}
                      onChange={(event) => setOrderForm((prev) => ({ ...prev, moneda: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="HNL">HNL - Lempira</option>
                      <option value="USD">USD - Dólar</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    Condiciones de pago
                    <input
                      type="text"
                      value={orderForm.condicionesPago}
                      onChange={(event) =>
                        setOrderForm((prev) => ({ ...prev, condicionesPago: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Ej. Contado, 30 días"
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-700">Detalle del pedido</h4>
                    <button
                      type="button"
                      onClick={() =>
                        setOrderLines((prev) => [
                          ...prev,
                          {
                            id: buildId(),
                            productoId: productos?.[0]?.id ?? '',
                            cantidad: '1',
                            precio: productos?.[0]?.precioBase?.toString() ?? '0',
                            descuentos: '0'
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
                          <th className="w-32 text-right">Precio</th>
                          <th className="w-24 text-right">Desc.</th>
                          <th className="w-12">&nbsp;</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderLines.map((linea) => (
                          <tr key={linea.id} className="bg-white">
                            <td className="rounded-l-xl border border-slate-200 px-3 py-2">
                              <select
                                value={linea.productoId}
                                onChange={(event) => handleOrderProductChange(linea.id, event.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                              >
                                {renderProductOptions}
                              </select>
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={linea.cantidad}
                                onChange={(event) => handleOrderLineChange(linea.id, 'cantidad', event.target.value)}
                                className="w-full rounded-md border border-slate-200 px-2 py-1 text-right"
                              />
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={linea.precio}
                                onChange={(event) => handleOrderLineChange(linea.id, 'precio', event.target.value)}
                                className="w-full rounded-md border border-slate-200 px-2 py-1 text-right"
                              />
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={linea.descuentos}
                                onChange={(event) => handleOrderLineChange(linea.id, 'descuentos', event.target.value)}
                                className="w-full rounded-md border border-slate-200 px-2 py-1 text-right"
                              />
                            </td>
                            <td className="rounded-r-xl border border-slate-200 px-2 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setOrderLines((prev) =>
                                    prev.length === 1 ? prev : prev.filter((item) => item.id !== linea.id)
                                  )
                                }
                                className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <footer className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p>
                      Subtotal: <strong>L {orderTotals.subtotal.toFixed(2)}</strong>
                    </p>
                    <p>
                      ISV 15%: <strong>L {orderTotals.isv.toFixed(2)}</strong>
                    </p>
                    <p>
                      Total documento: <strong>L {orderTotals.total.toFixed(2)}</strong>
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={orderMutation.isPending}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:bg-slate-300"
                  >
                    {orderMutation.isPending ? 'Guardando…' : 'Registrar pedido'}
                  </button>
                </footer>
              </form>
            </SAPDocumentCard>
          )}

          {activeWorkflow === 'entrega' && (
            <SAPDocumentCard
              title="Entrega de mercancía"
              subtitle="Emisión de documento de salida con actualización automática del kardex."
              documentCode="DELIVERY"
              status={deliveryStatus}
              onReset={resetDeliveryForm}
            >
              <form
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  setDeliveryStatus(null);
                  deliveryMutation.mutate();
                }}
                className="space-y-6"
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-1 text-sm text-slate-600">
                    Pedido relacionado
                    <select
                      value={deliveryForm.pedidoId}
                      onChange={(event) => setDeliveryForm((prev) => ({ ...prev, pedidoId: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Entrega libre</option>
                      {pedidos?.map((pedido) => (
                        <option key={pedido.id} value={pedido.id}>
                          {pedido.codigo} · {pedido.clienteNombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    Almacén origen
                    <select
                      value={deliveryForm.almacenId}
                      onChange={(event) => setDeliveryForm((prev) => ({ ...prev, almacenId: event.target.value }))}
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
                    Fecha de salida
                    <input
                      type="date"
                      value={deliveryForm.fecha}
                      onChange={(event) => setDeliveryForm((prev) => ({ ...prev, fecha: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-700">Líneas a entregar</h4>
                    <button
                      type="button"
                      onClick={() =>
                        setDeliveryLines((prev) => [
                          ...prev,
                          {
                            id: buildId(),
                            productoId: productos?.[0]?.id ?? '',
                            cantidad: '1',
                            costoUnitario: productos?.[0]?.precioBase?.toString() ?? '0'
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
                        {deliveryLines.map((linea) => (
                          <tr key={linea.id} className="bg-white">
                            <td className="rounded-l-xl border border-slate-200 px-3 py-2">
                              <select
                                value={linea.productoId}
                                onChange={(event) => handleDeliveryProductChange(linea.id, event.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                              >
                                {renderProductOptions}
                              </select>
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={linea.cantidad}
                                onChange={(event) => handleDeliveryLineChange(linea.id, 'cantidad', event.target.value)}
                                className="w-full rounded-md border border-slate-200 px-2 py-1 text-right"
                              />
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={linea.costoUnitario}
                                onChange={(event) => handleDeliveryLineChange(linea.id, 'costoUnitario', event.target.value)}
                                className="w-full rounded-md border border-slate-200 px-2 py-1 text-right"
                              />
                            </td>
                            <td className="rounded-r-xl border border-slate-200 px-2 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setDeliveryLines((prev) =>
                                    prev.length === 1 ? prev : prev.filter((item) => item.id !== linea.id)
                                  )
                                }
                                className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <footer className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
                  <p>
                    Valor de salida: <strong>L {deliveryTotals.toFixed(2)}</strong>
                  </p>
                  <button
                    type="submit"
                    disabled={deliveryMutation.isPending}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:bg-slate-300"
                  >
                    {deliveryMutation.isPending ? 'Aplicando…' : 'Registrar entrega'}
                  </button>
                </footer>
              </form>
            </SAPDocumentCard>
          )}

          {activeWorkflow === 'factura' && (
            <SAPDocumentCard
              title="Factura de cliente"
              subtitle="Documento fiscal listo para timbrado electrónico y envío."
              documentCode="A/R INVOICE"
              status={invoiceStatus}
              onReset={resetInvoiceForm}
            >
              <form
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                  event.preventDefault();
                  setInvoiceStatus(null);
                  invoiceMutation.mutate();
                }}
                className="space-y-6"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-600">
                    Pedido base
                    <select
                      value={invoiceForm.pedidoId}
                      onChange={(event) => setInvoiceForm((prev) => ({ ...prev, pedidoId: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      {pedidos?.map((pedido) => (
                        <option key={pedido.id} value={pedido.id}>
                          {pedido.codigo} · {pedido.clienteNombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    Fecha de emisión
                    <input
                      type="date"
                      value={invoiceForm.fechaEmision}
                      onChange={(event) =>
                        setInvoiceForm((prev) => ({ ...prev, fechaEmision: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    Moneda
                    <select
                      value={invoiceForm.moneda}
                      onChange={(event) => setInvoiceForm((prev) => ({ ...prev, moneda: event.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="HNL">HNL - Lempira</option>
                      <option value="USD">USD - Dólar</option>
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    Tipo de comprobante
                    <input
                      type="text"
                      value={invoiceForm.tipoComprobante}
                      onChange={(event) =>
                        setInvoiceForm((prev) => ({ ...prev, tipoComprobante: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Ej. FACTURA, CCF"
                    />
                  </label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-700">Detalle de la factura</h4>
                    <button
                      type="button"
                      onClick={() =>
                        setInvoiceLines((prev) => [
                          ...prev,
                          {
                            id: buildId(),
                            descripcion: productos?.[0]?.descripcion ?? 'Servicio',
                            cantidad: '1',
                            precioUnitario: productos?.[0]?.precioBase?.toString() ?? '0'
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
                          <th className="text-left">Descripción</th>
                          <th className="w-24 text-right">Cantidad</th>
                          <th className="w-32 text-right">Precio</th>
                          <th className="w-12">&nbsp;</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceLines.map((linea) => (
                          <tr key={linea.id} className="bg-white">
                            <td className="rounded-l-xl border border-slate-200 px-3 py-2">
                              <input
                                type="text"
                                value={linea.descripcion}
                                onChange={(event) =>
                                  handleInvoiceLineChange(linea.id, 'descripcion', event.target.value)
                                }
                                className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                              />
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={linea.cantidad}
                                onChange={(event) =>
                                  handleInvoiceLineChange(linea.id, 'cantidad', event.target.value)
                                }
                                className="w-full rounded-md border border-slate-200 px-2 py-1 text-right"
                              />
                            </td>
                            <td className="border border-slate-200 px-3 py-2 text-right">
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={linea.precioUnitario}
                                onChange={(event) =>
                                  handleInvoiceLineChange(linea.id, 'precioUnitario', event.target.value)
                                }
                                className="w-full rounded-md border border-slate-200 px-2 py-1 text-right"
                              />
                            </td>
                            <td className="rounded-r-xl border border-slate-200 px-2 text-center">
                              <button
                                type="button"
                                onClick={() =>
                                  setInvoiceLines((prev) =>
                                    prev.length === 1 ? prev : prev.filter((item) => item.id !== linea.id)
                                  )
                                }
                                className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <footer className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
                  <p>
                    Total factura: <strong>L {invoiceTotals.toFixed(2)}</strong>
                  </p>
                  <button
                    type="submit"
                    disabled={invoiceMutation.isPending}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:bg-slate-300"
                  >
                    {invoiceMutation.isPending ? 'Emitiendo…' : 'Emitir factura'}
                  </button>
                </footer>
              </form>
            </SAPDocumentCard>
          )}

        </div>

        <div className="space-y-6">
          <DataTable<SalesOrderRow>
            title="Pedidos recientes"
            data={pedidos ?? []}
            columns={columns}
          />
        </div>
      </div>
    </div>
  );
};
