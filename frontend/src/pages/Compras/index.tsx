import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
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
  descripcion: string;
  precioBase: number;
}

interface Warehouse {
  id: string;
  nombre: string;
}

interface PurchaseOrderRow {
  id: string;
  proveedor_id: string;
  fecha: string;
  estado: string;
  moneda: string;
  total: string;
}

type PurchaseLineState = {
  id: string;
  productoId: string;
  cantidad: string;
  precio: string;
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
  const [purchaseForm, setPurchaseForm] = useState({
    proveedorId: '',
    solicitanteId: '',
    fecha: new Date().toISOString().slice(0, 10),
    moneda: 'HNL',
    condicionesPago: '30 días'
  });
  const [purchaseLines, setPurchaseLines] = useState<PurchaseLineState[]>([]);
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
    setPurchaseForm((prev) => ({ ...prev, solicitanteId: prev.solicitanteId || proveedores[0].id }));
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
              precio: productos[0].precioBase.toString()
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

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        proveedorId: purchaseForm.proveedorId,
        fecha: purchaseForm.fecha,
        moneda: purchaseForm.moneda,
        condicionesPago: purchaseForm.condicionesPago,
        solicitanteId: purchaseForm.solicitanteId,
        lineas: purchaseLines.map((linea) => ({
          productoId: linea.productoId,
          cantidad: Number(linea.cantidad) || 0,
          precio: Number(linea.precio) || 0,
          impuestos: []
        }))
      };

      const { data } = await api.post('/compras/ordenes', payload);
      return data;
    },
    onSuccess: () => {
      setOrderStatus({
        type: 'success',
        message: 'Orden de compra registrada y enviada a aprobación automática.'
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

  const purchaseTotals = useMemo(() =>
    purchaseLines.reduce((acc, linea) => acc + (Number(linea.cantidad) || 0) * (Number(linea.precio) || 0), 0),
  [purchaseLines]);

  const receiptTotals = useMemo(() =>
    receiptLines.reduce((acc, linea) => acc + (Number(linea.cantidad) || 0) * (Number(linea.costo) || 0), 0),
  [receiptLines]);

  const columns: Column<PurchaseOrderRow>[] = [
    { header: 'OC', accessor: 'id' },
    { header: 'Proveedor', accessor: 'proveedor_id' },
    { header: 'Fecha', accessor: 'fecha' },
    { header: 'Estado', accessor: 'estado' },
    { header: 'Moneda', accessor: 'moneda' },
    { header: 'Total', accessor: 'total' }
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
    const precio = productos?.find((producto) => producto.id === productoId)?.precioBase ?? 0;
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
    setPurchaseForm({
      proveedorId: proveedores[0].id,
      solicitanteId: proveedores[0].id,
      fecha: new Date().toISOString().slice(0, 10),
      moneda: 'HNL',
      condicionesPago: '30 días'
    });
    setPurchaseLines([
      {
        id: buildId(),
        productoId: productos[0].id,
        cantidad: '1',
        precio: productos[0].precioBase.toString()
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

  const productOptions = productos?.map((producto) => (
    <option key={producto.id} value={producto.id}>
      {producto.descripcion}
    </option>
  ));

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
                purchaseMutation.mutate();
              }}
              className="space-y-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
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
                  Solicitante
                  <input
                    type="text"
                    value={purchaseForm.solicitanteId}
                    onChange={(event) => setPurchaseForm((prev) => ({ ...prev, solicitanteId: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="ID del solicitante"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-600">
                  Fecha del documento
                  <input
                    type="date"
                    value={purchaseForm.fecha}
                    onChange={(event) => setPurchaseForm((prev) => ({ ...prev, fecha: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-600">
                  Condiciones de pago
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
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Partidas de la orden</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setPurchaseLines((prev) => [
                        ...prev,
                        {
                          id: buildId(),
                          productoId: productos?.[0]?.id ?? '',
                          cantidad: '1',
                          precio: productos?.[0]?.precioBase?.toString() ?? '0'
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
                        <th className="w-12">&nbsp;</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseLines.map((linea) => (
                        <tr key={linea.id} className="bg-white">
                          <td className="rounded-l-xl border border-slate-200 px-3 py-2">
                            <select
                              value={linea.productoId}
                              onChange={(event) => handlePurchaseProductChange(linea.id, event.target.value)}
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                            >
                              {productOptions}
                            </select>
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={linea.cantidad}
                              onChange={(event) => handlePurchaseLineChange(linea.id, 'cantidad', event.target.value)}
                              className="w-full rounded-md border border-slate-200 px-2 py-1 text-right"
                            />
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={linea.precio}
                              onChange={(event) => handlePurchaseLineChange(linea.id, 'precio', event.target.value)}
                              className="w-full rounded-md border border-slate-200 px-2 py-1 text-right"
                            />
                          </td>
                          <td className="rounded-r-xl border border-slate-200 px-2 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setPurchaseLines((prev) =>
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
                  Total estimado: <strong>L {purchaseTotals.toFixed(2)}</strong>
                </p>
                <button
                  type="submit"
                  disabled={purchaseMutation.isPending}
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:bg-slate-300"
                >
                  {purchaseMutation.isPending ? 'Guardando…' : 'Registrar orden'}
                </button>
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
                        {orden.id}
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
                      {receiptLines.map((linea) => (
                        <tr key={linea.id} className="bg-white">
                          <td className="rounded-l-xl border border-slate-200 px-3 py-2">
                            <select
                              value={linea.productoId}
                              onChange={(event) => handleReceiptProductChange(linea.id, event.target.value)}
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                            >
                              {productOptions}
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
                      ))}
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
