import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';

type FormState = {
  referencia: string;
  tercero: string;
  monto: string;
  fecha: string;
};

interface TransactionConfig {
  key: TransactionType;
  label: string;
  description: string;
  endpoint: string;
  buildPayload: (form: FormState) => Record<string, unknown>;
  invalidate?: string[][];
  successMessage: string;
}

type TransactionType =
  | 'compras'
  | 'ventas'
  | 'inventario'
  | 'facturacion'
  | 'contabilidad';

const buildDefaultForm = (): FormState => ({
  referencia: '',
  tercero: '',
  monto: '',
  fecha: new Date().toISOString().split('T')[0]
});

const TRANSACTIONS: TransactionConfig[] = [
  {
    key: 'compras',
    label: 'Orden de compra',
    description:
      'Registra una nueva orden de compra con proveedor hondureño, validando presupuesto y retenciones locales.',
    endpoint: '/compras/ordenes',
    buildPayload: (form) => ({
      proveedor_nombre: form.tercero || 'Proveedor acciones rápidas',
      fecha: form.fecha,
      estado: 'BORRADOR',
      moneda: 'HNL',
      total: Number(form.monto || 0),
      referencia: form.referencia || undefined
    }),
    invalidate: [['compras', 'ordenes']],
    successMessage: 'Orden de compra generada con éxito.'
  },
  {
    key: 'ventas',
    label: 'Pedido de venta',
    description:
      'Crea pedidos de venta con cálculo de ISV y control de crédito para clientes locales o de exportación.',
    endpoint: '/ventas/pedidos',
    buildPayload: (form) => ({
      cliente_id: form.tercero || 'CLI-HN-001',
      fecha: form.fecha,
      estado: 'Pendiente',
      moneda: 'HNL',
      total: Number(form.monto || 0),
      referencia: form.referencia
    }),
    invalidate: [['ventas', 'pedidos']],
    successMessage: 'Pedido de venta registrado.'
  },
  {
    key: 'inventario',
    label: 'Movimiento de inventario',
    description:
      'Actualiza el inventario con movimientos de entrada o salida, afectando costos promedio y lotes.',
    endpoint: '/inventario/movimientos',
    buildPayload: (form) => ({
      producto_id: form.referencia || 'PROD-HN-001',
      tipo: Number(form.monto) >= 0 ? 'entrada' : 'salida',
      cantidad: Math.abs(Number(form.monto || 0)),
      fecha: form.fecha,
      observaciones: `Ajuste rápido ${form.tercero || 'sin proveedor'}`
    }),
    invalidate: [['inventario', 'valuacion']],
    successMessage: 'Movimiento de inventario creado.'
  },
  {
    key: 'facturacion',
    label: 'Factura electrónica',
    description:
      'Emite un documento fiscal compatible con la factura electrónica del SAR con ISV 15%/18%.',
    endpoint: '/facturacion/facturas',
    buildPayload: (form) => ({
      numero_control: form.referencia || 'FAC-HN-001',
      cliente_id: form.tercero || 'CLI-HN-001',
      fecha_emision: form.fecha,
      moneda: 'HNL',
      total: Number(form.monto || 0),
      estado: 'Generada'
    }),
    invalidate: [['facturacion', 'facturas']],
    successMessage: 'Factura enviada para autorización.'
  },
  {
    key: 'contabilidad',
    label: 'Póliza contable',
    description:
      'Genera automáticamente una póliza contable con distribución por centros de costo.',
    endpoint: '/contabilidad/asientos',
    buildPayload: (form) => ({
      fecha: form.fecha,
      descripcion: form.referencia || 'Póliza rápida',
      diario: form.tercero || 'GENERAL',
      total_debe: Number(form.monto || 0),
      total_haber: Number(form.monto || 0)
    }),
    invalidate: [['contabilidad', 'asientos']],
    successMessage: 'Póliza contable creada.'
  }
];

export const TransactionQuickActions = () => {
  const [selected, setSelected] = useState<TransactionConfig>(TRANSACTIONS[0]);
  const [form, setForm] = useState<FormState>(buildDefaultForm);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: { config: TransactionConfig; form: FormState }) => {
      return api.post(payload.config.endpoint, payload.config.buildPayload(payload.form));
    },
    onSuccess: (_, variables) => {
      variables.config.invalidate?.forEach((queryKey) => {
        void queryClient.invalidateQueries({ queryKey });
      });
    }
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    try {
      await mutation.mutateAsync({ config: selected, form });
      setStatus({ type: 'success', message: selected.successMessage });
      setForm(buildDefaultForm());
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'No fue posible registrar la transacción.'
      });
    }
  };

  const isSubmitting = mutation.isPending;

  const helperText = useMemo(() => selected.description, [selected]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 text-slate-100 shadow-2xl overflow-hidden">
      <div className="grid gap-0 lg:grid-cols-[220px,1fr]">
        <div className="hidden flex-col border-b border-slate-800 bg-secondary/70 p-4 lg:flex lg:border-b-0 lg:border-r">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
            Transacciones frecuentes
          </p>
          <div className="mt-4 flex-1 space-y-2">
            {TRANSACTIONS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setSelected(item);
                  setForm(buildDefaultForm());
                  setStatus(null);
                }}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${
                  selected.key === item.key
                    ? 'bg-primary/25 text-white shadow-inner shadow-primary/30'
                    : 'bg-slate-900/40 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <p className="font-semibold">{item.label}</p>
                <p className="text-xs text-slate-400">{item.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div className="space-y-1 lg:hidden">
            <label htmlFor="transaction-type" className="text-sm font-medium text-slate-200">
              Tipo de transacción
            </label>
            <select
              id="transaction-type"
              value={selected.key}
              onChange={(event) => {
                const next = TRANSACTIONS.find((item) => item.key === event.target.value as TransactionType);
                if (next) {
                  setSelected(next);
                  setForm(buildDefaultForm());
                  setStatus(null);
                }
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none"
            >
              {TRANSACTIONS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">{selected.label}</h3>
            <p className="text-sm text-slate-300">{helperText}</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="space-y-1">
              <label htmlFor="referencia" className="text-sm font-medium text-slate-200">
                Referencia / Documento
              </label>
              <input
                id="referencia"
                value={form.referencia}
                onChange={(event) => setForm((prev) => ({ ...prev, referencia: event.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none"
                placeholder="Ej. OC-2024-001"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="tercero" className="text-sm font-medium text-slate-200">
                Cliente / Proveedor / Diario
              </label>
              <input
                id="tercero"
                value={form.tercero}
                onChange={(event) => setForm((prev) => ({ ...prev, tercero: event.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none"
                placeholder="Ej. PROV-HN-045"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="monto" className="text-sm font-medium text-slate-200">
                Monto / Cantidad
              </label>
              <input
                id="monto"
                type="number"
                step="0.01"
                value={form.monto}
                onChange={(event) => setForm((prev) => ({ ...prev, monto: event.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="fecha" className="text-sm font-medium text-slate-200">
                Fecha
              </label>
              <input
                id="fecha"
                type="date"
                value={form.fecha}
                onChange={(event) => setForm((prev) => ({ ...prev, fecha: event.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Guardando…' : 'Crear transacción'}
            </button>
          </form>

          {status && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                status.type === 'success'
                  ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                  : 'border-red-400/40 bg-red-500/10 text-red-200'
              }`}
            >
              {status.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
