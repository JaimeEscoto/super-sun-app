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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [form, setForm] = useState<FormState>(buildDefaultForm);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const queryClient = useQueryClient();

  const selected = TRANSACTIONS[currentIndex];
  const totalTransactions = TRANSACTIONS.length;

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

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setForm(buildDefaultForm());
    setStatus(null);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      goTo(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalTransactions - 1) {
      goTo(currentIndex + 1);
    }
  };

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
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-100 shadow-[0_40px_90px_-55px_rgba(59,130,246,0.8)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.2),transparent_60%)]" />
      <div className="relative space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">
              Transacción {currentIndex + 1} de {totalTransactions}
            </p>
            <h3 className="text-2xl font-semibold text-white">{selected.label}</h3>
            <p className="text-sm leading-relaxed text-white/70">{helperText}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 transition hover:border-primary/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex === totalTransactions - 1}
              className="inline-flex items-center gap-2 rounded-full border border-primary/60 bg-primary/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Siguiente
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {TRANSACTIONS.map((item, index) => (
            <button
              key={item.key}
              type="button"
              onClick={() => goTo(index)}
              className={`rounded-full border px-3 py-1 transition ${
                index === currentIndex
                  ? 'border-primary/60 bg-primary/20 text-white'
                  : 'border-white/10 bg-white/5 text-white/60 hover:border-primary/40 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 lg:hidden">
          <label htmlFor="transaction-type" className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">
            Seleccionar
          </label>
          <select
            id="transaction-type"
            value={selected.key}
            onChange={(event) => {
              const nextIndex = TRANSACTIONS.findIndex((item) => item.key === event.target.value as TransactionType);
              if (nextIndex >= 0) {
                goTo(nextIndex);
              }
            }}
            className="w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
          >
            {TRANSACTIONS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr,1.4fr]">
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Resumen</p>
              <p className="mt-2 leading-relaxed">{helperText}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
              <p className="font-semibold text-white">Confirmación esperada</p>
              <p className="mt-1 leading-relaxed">{selected.successMessage}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="referencia" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Referencia / Documento
                </label>
                <input
                  id="referencia"
                  value={form.referencia}
                  onChange={(event) => setForm((prev) => ({ ...prev, referencia: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                  placeholder="Ej. OC-2024-001"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="tercero" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Cliente / Proveedor / Diario
                </label>
                <input
                  id="tercero"
                  value={form.tercero}
                  onChange={(event) => setForm((prev) => ({ ...prev, tercero: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                  placeholder="Ej. PROV-HN-045"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr,0.9fr]">
              <div className="space-y-2">
                <label htmlFor="monto" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Monto / Cantidad
                </label>
                <input
                  id="monto"
                  type="number"
                  step="0.01"
                  value={form.monto}
                  onChange={(event) => setForm((prev) => ({ ...prev, monto: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="fecha" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                  Fecha
                </label>
                <input
                  id="fecha"
                  type="date"
                  value={form.fecha}
                  onChange={(event) => setForm((prev) => ({ ...prev, fecha: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-gradient-to-r from-primary/80 via-sky-500/80 to-emerald-400/70 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-[0_20px_50px_-30px_rgba(14,165,233,0.8)] transition hover:from-primary/90 hover:via-sky-500/90 hover:to-emerald-400/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Guardando…' : 'Crear transacción'}
            </button>

            {status && (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  status.type === 'success'
                    ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-100'
                    : 'border-red-400/60 bg-red-500/10 text-red-100'
                }`}
              >
                {status.message}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
};
