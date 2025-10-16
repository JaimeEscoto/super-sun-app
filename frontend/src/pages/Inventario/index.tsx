import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

import { Column, DataTable } from '@/components/cards/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { SAPDocumentCard } from '@/components/sap/SAPDocumentCard';
import api from '@/lib/api';

interface Valuacion {
  producto_id: string;
  existencias: string;
  valor_total: string;
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

type TransferLineState = {
  id: string;
  productoId: string;
  cantidad: string;
  costoUnitario: string;
};

const buildId = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));

export const InventarioPage = () => {
  const queryClient = useQueryClient();
  const [transferStatus, setTransferStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [transferForm, setTransferForm] = useState({
    origenId: '',
    destinoId: '',
    motivo: 'Transferencia interna',
    lineas: [] as TransferLineState[]
  });

  const { data } = useQuery({
    queryKey: ['inventario', 'valuacion'],
    queryFn: async () => {
      const response = await api.get<{ data: Valuacion[] }>('/inventario/valuacion');
      return response.data.data;
    }
  });

  const { data: productos } = useQuery({
    queryKey: ['catalogos', 'productos'],
    queryFn: async () => {
      const { data: response } = await api.get<{ data: Product[] }>('/catalogos/productos', {
        params: { page: 1, pageSize: 100 }
      });
      return response.data;
    }
  });

  const { data: almacenes } = useQuery({
    queryKey: ['catalogos', 'almacenes'],
    queryFn: async () => {
      const { data: response } = await api.get<{ data: Warehouse[] }>('/catalogos/almacenes', {
        params: { page: 1, pageSize: 25 }
      });
      return response.data;
    }
  });

  useEffect(() => {
    if (!almacenes?.length) {
      return;
    }
    setTransferForm((prev) => ({
      ...prev,
      origenId: prev.origenId || almacenes[0].id,
      destinoId: prev.destinoId || (almacenes[1]?.id ?? almacenes[0].id)
    }));
  }, [almacenes]);

  useEffect(() => {
    if (!productos?.length) {
      return;
    }
    setTransferForm((prev) => ({
      ...prev,
      lineas:
        prev.lineas.length > 0
          ? prev.lineas
          : [
              {
                id: buildId(),
                productoId: productos[0].id,
                cantidad: '1',
                costoUnitario: productos[0].precioBase.toString()
              }
            ]
    }));
  }, [productos]);

  const transferMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        origenId: transferForm.origenId,
        destinoId: transferForm.destinoId,
        motivo: transferForm.motivo,
        lineas: transferForm.lineas.map((linea) => ({
          productoId: linea.productoId,
          cantidad: Number(linea.cantidad) || 0,
          costoUnitario: Number(linea.costoUnitario) || undefined
        }))
      };

      const { data: response } = await api.post('/inventario/transferencias', payload);
      return response;
    },
    onSuccess: () => {
      setTransferStatus({
        type: 'success',
        message: 'Transferencia ejecutada con éxito. Kardex actualizado en ambos almacenes.'
      });
      queryClient.invalidateQueries({ queryKey: ['inventario', 'valuacion'] });
    },
    onError: (error) => {
      const message =
        (axios.isAxiosError(error) && error.response?.data?.message) || 'No se pudo registrar la transferencia.';
      setTransferStatus({ type: 'error', message });
    }
  });

  const handleLineChange = (id: string, field: keyof TransferLineState, value: string) => {
    setTransferForm((prev) => ({
      ...prev,
      lineas: prev.lineas.map((linea) =>
        linea.id === id
          ? {
              ...linea,
              [field]: value
            }
          : linea
      )
    }));
  };

  const handleProductChange = (id: string, productoId: string) => {
    const costo = productos?.find((producto) => producto.id === productoId)?.precioBase ?? 0;
    handleLineChange(id, 'productoId', productoId);
    handleLineChange(id, 'costoUnitario', costo.toString());
  };

  const resetTransferForm = () => {
    if (!productos?.length || !almacenes?.length) {
      return;
    }
    setTransferStatus(null);
    setTransferForm({
      origenId: almacenes[0].id,
      destinoId: almacenes[1]?.id ?? almacenes[0].id,
      motivo: 'Transferencia interna',
      lineas: [
        {
          id: buildId(),
          productoId: productos[0].id,
          cantidad: '1',
          costoUnitario: productos[0].precioBase.toString()
        }
      ]
    });
  };

  const transferTotal = useMemo(
    () =>
      transferForm.lineas.reduce(
        (acc, linea) => acc + (Number(linea.cantidad) || 0) * (Number(linea.costoUnitario) || 0),
        0
      ),
    [transferForm.lineas]
  );

  const columns: Column<Valuacion>[] = [
    { header: 'Producto', accessor: 'producto_id' },
    { header: 'Existencias', accessor: 'existencias' },
    { header: 'Valor total', accessor: 'valor_total' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventario y logística"
        description="Controla inventario multialmacén, lotes, ubicaciones y valoración costo promedio/PEPS con alertas de reabastecimiento en tiempo real."
      />
      <div className="grid gap-6 lg:grid-cols-[1.35fr,1fr]">
        <div className="space-y-6">
          <SAPDocumentCard
            title="Transferencia de stock"
            subtitle="Mueve existencias entre almacenes con ajuste automático de costos."
            documentCode="INVENTORY TRANSFER"
            status={transferStatus}
            onReset={resetTransferForm}
          >
            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                setTransferStatus(null);
                transferMutation.mutate();
              }}
              className="space-y-6"
            >
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-1 text-sm text-slate-600">
                  Almacén origen
                  <select
                    value={transferForm.origenId}
                    onChange={(event) => setTransferForm((prev) => ({ ...prev, origenId: event.target.value }))}
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
                  Almacén destino
                  <select
                    value={transferForm.destinoId}
                    onChange={(event) => setTransferForm((prev) => ({ ...prev, destinoId: event.target.value }))}
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
                  Motivo
                  <input
                    type="text"
                    value={transferForm.motivo}
                    onChange={(event) => setTransferForm((prev) => ({ ...prev, motivo: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Partidas transferidas</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setTransferForm((prev) => ({
                        ...prev,
                        lineas: [
                          ...prev.lineas,
                          {
                            id: buildId(),
                            productoId: productos?.[0]?.id ?? '',
                            cantidad: '1',
                            costoUnitario: productos?.[0]?.precioBase?.toString() ?? '0'
                          }
                        ]
                      }))
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
                        <th className="text-left">Producto</th>
                        <th className="w-24 text-right">Cantidad</th>
                        <th className="w-32 text-right">Costo</th>
                        <th className="w-12">&nbsp;</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transferForm.lineas.map((linea) => (
                        <tr key={linea.id} className="bg-white">
                          <td className="rounded-l-xl border border-slate-200 px-3 py-2">
                            <select
                              value={linea.productoId}
                              onChange={(event) => handleProductChange(linea.id, event.target.value)}
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                            >
                              {productos?.map((producto) => (
                                <option key={producto.id} value={producto.id}>
                                  {producto.descripcion}
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
                              onChange={(event) => handleLineChange(linea.id, 'cantidad', event.target.value)}
                              className="w-full rounded-md border border-slate-200 px-2 py-1 text-right"
                            />
                          </td>
                          <td className="border border-slate-200 px-3 py-2 text-right">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={linea.costoUnitario}
                              onChange={(event) => handleLineChange(linea.id, 'costoUnitario', event.target.value)}
                              className="w-full rounded-md border border-slate-200 px-2 py-1 text-right"
                            />
                          </td>
                          <td className="rounded-r-xl border border-slate-200 px-2 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                setTransferForm((prev) => ({
                                  ...prev,
                                  lineas:
                                    prev.lineas.length === 1
                                      ? prev.lineas
                                      : prev.lineas.filter((item) => item.id !== linea.id)
                                }))
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
                  Valor transferido: <strong>L {transferTotal.toFixed(2)}</strong>
                </p>
                <button
                  type="submit"
                  disabled={transferMutation.isPending}
                  className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:bg-slate-300"
                >
                  {transferMutation.isPending ? 'Procesando…' : 'Registrar transferencia'}
                </button>
              </footer>
            </form>
          </SAPDocumentCard>

          <DataTable<Valuacion>
            title="Valuación de inventario"
            data={data ?? []}
            columns={columns}
          />
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Control PEPS y promedio ponderado</h3>
          <p className="text-sm text-slate-300">
            Permite elegir costo predeterminado PEPS o Promedio ponderado, gestionar lotes/series y ejecutar conteos cíclicos con ajustes automáticos y asientos contables.
          </p>
        </div>
      </div>
    </div>
  );
};
