import { Plus, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

type PurchaseOrderFormState = {
  proveedor: string;
  solicitante: string;
  bodega: string;
  moneda: string;
  condicionesPago: string;
  fechaEntrega: string;
  tipoCompra: string;
  observaciones: string;
};

type PurchaseOrderItem = {
  id: string;
  articulo: string;
  descripcion: string;
  cantidad: string;
  precioUnitario: string;
  fechaEntrega: string;
  centroCosto: string;
};

const buildEmptyItem = (): PurchaseOrderItem => ({
  id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
  articulo: '',
  descripcion: '',
  cantidad: '1',
  precioUnitario: '0.00',
  fechaEntrega: '',
  centroCosto: 'General'
});

const supplierOptions = [
  'Proveedor estratégico - Químicos del Norte',
  'Proveedor local - Envases Tegucigalpa',
  'Proveedor regional - Agroinsumos CA'
];

const paymentTerms = ['Contado', '15 días', '30 días', '60 días'];
const warehouses = ['Bodega principal San Pedro Sula', 'Planta Choloma', 'Centro de distribución Tegucigalpa'];
const purchaseTypes = ['Materia prima', 'Servicios', 'Empaque', 'Repuestos'];

export const PurchaseOrderForm = () => {
  const [formState, setFormState] = useState<PurchaseOrderFormState>({
    proveedor: supplierOptions[0],
    solicitante: 'Jefe de producción',
    bodega: warehouses[0],
    moneda: 'HNL',
    condicionesPago: paymentTerms[2],
    fechaEntrega: new Date().toISOString().slice(0, 10),
    tipoCompra: purchaseTypes[0],
    observaciones: ''
  });
  const [items, setItems] = useState<PurchaseOrderItem[]>([buildEmptyItem()]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => {
      const quantity = Number.parseFloat(item.cantidad) || 0;
      const price = Number.parseFloat(item.precioUnitario) || 0;
      return acc + quantity * price;
    }, 0);

    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    return {
      subtotal,
      tax,
      total
    };
  }, [items]);

  const handleFormChange = (field: keyof PurchaseOrderFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (id: string, field: keyof PurchaseOrderItem, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value
            }
          : item
      )
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, buildEmptyItem()]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setStatusMessage(
      `Orden lista para aprobación: ${formState.proveedor} con ${items.length} partidas por un total estimado de HNL ${totals.total.toFixed(
        2
      )}.`
    );
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">Orden de compra</p>
        <h3 className="text-lg font-semibold text-white">Definir condiciones comerciales</h3>
        <p className="text-sm text-slate-300">
          Completa los datos clave antes de enviar la orden a aprobación. El cálculo de impuestos aplica automáticamente un ISV
          del 15% sobre los artículos gravables.
        </p>
        {statusMessage ? (
          <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-xs text-emerald-200">
            {statusMessage}
          </div>
        ) : null}
      </header>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Proveedor</label>
            <select
              value={formState.proveedor}
              onChange={(event) => handleFormChange('proveedor', event.target.value)}
              className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            >
              {supplierOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Solicitante</label>
              <input
                type="text"
                value={formState.solicitante}
                onChange={(event) => handleFormChange('solicitante', event.target.value)}
                className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                placeholder="Nombre del solicitante"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Bodega destino</label>
              <select
                value={formState.bodega}
                onChange={(event) => handleFormChange('bodega', event.target.value)}
                className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                {warehouses.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Moneda</label>
              <select
                value={formState.moneda}
                onChange={(event) => handleFormChange('moneda', event.target.value)}
                className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="HNL">HNL - Lempira hondureño</option>
                <option value="USD">USD - Dólar estadounidense</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Condiciones de pago</label>
              <select
                value={formState.condicionesPago}
                onChange={(event) => handleFormChange('condicionesPago', event.target.value)}
                className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                {paymentTerms.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Fecha de entrega</label>
              <input
                type="date"
                value={formState.fechaEntrega}
                onChange={(event) => handleFormChange('fechaEntrega', event.target.value)}
                className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Tipo de compra</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {purchaseTypes.map((type) => {
                const isActive = formState.tipoCompra === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleFormChange('tipoCompra', type)}
                    className={`rounded-xl border px-4 py-2 text-left text-sm transition ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                        : 'border-slate-800/70 bg-slate-900/60 text-slate-300 hover:border-emerald-500/40 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Notas para el proveedor</label>
            <textarea
              value={formState.observaciones}
              onChange={(event) => handleFormChange('observaciones', event.target.value)}
              rows={5}
              className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              placeholder="Instrucciones de empaque, logística o aclaraciones fiscales"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white">Detalle de artículos y servicios</h4>
            <p className="text-xs text-slate-400">Define cantidades, costos y centros de costo asociados.</p>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition hover:bg-emerald-500/20"
          >
            <Plus size={14} /> Agregar partida
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 sm:grid-cols-2 xl:grid-cols-6"
            >
              <div className="space-y-1 xl:col-span-2">
                <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Artículo / servicio</label>
                <input
                  type="text"
                  value={item.articulo}
                  onChange={(event) => handleItemChange(item.id, 'articulo', event.target.value)}
                  placeholder={`Descripción corta partida ${index + 1}`}
                  className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1 xl:col-span-2">
                <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Detalle técnico</label>
                <input
                  type="text"
                  value={item.descripcion}
                  onChange={(event) => handleItemChange(item.id, 'descripcion', event.target.value)}
                  placeholder="Especificaciones, calibre, marca..."
                  className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Cantidad</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.cantidad}
                  onChange={(event) => handleItemChange(item.id, 'cantidad', event.target.value)}
                  className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Precio unitario</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.precioUnitario}
                  onChange={(event) => handleItemChange(item.id, 'precioUnitario', event.target.value)}
                  className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Entrega</label>
                <input
                  type="date"
                  value={item.fechaEntrega}
                  onChange={(event) => handleItemChange(item.id, 'fechaEntrega', event.target.value)}
                  className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.25em] text-slate-400">Centro de costo</label>
                <input
                  type="text"
                  value={item.centroCosto}
                  onChange={(event) => handleItemChange(item.id, 'centroCosto', event.target.value)}
                  className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-200 transition hover:bg-red-500/20"
                  aria-label="Eliminar partida"
                >
                  <Trash2 size={14} />
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="grid gap-5 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-xs text-slate-300">
            <p className="font-semibold text-white">Checklist antes de enviar</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Confirma que el proveedor esté activo y con retenciones asignadas.</li>
              <li>Valida cantidades con el requerimiento interno y fechas de entrega comprometidas.</li>
              <li>Revisa impuestos y moneda para evitar diferencias en recepción.</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500 bg-emerald-500 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-emerald-400"
            >
              Guardar orden para aprobación
            </button>
            <button
              type="button"
              onClick={() => {
                setFormState({
                  proveedor: supplierOptions[0],
                  solicitante: 'Jefe de producción',
                  bodega: warehouses[0],
                  moneda: 'HNL',
                  condicionesPago: paymentTerms[2],
                  fechaEntrega: new Date().toISOString().slice(0, 10),
                  tipoCompra: purchaseTypes[0],
                  observaciones: ''
                });
                setItems([buildEmptyItem()]);
                setStatusMessage(null);
              }}
              className="inline-flex items-center justify-center rounded-full border border-slate-800/70 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-slate-300 transition hover:border-emerald-500/40 hover:text-white"
            >
              Limpiar formulario
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4">
          <h4 className="text-sm font-semibold text-white">Resumen económico</h4>
          <dl className="mt-3 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Subtotal</dt>
              <dd className="font-medium text-white">HNL {totals.subtotal.toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">ISV 15%</dt>
              <dd className="font-medium text-white">HNL {totals.tax.toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800/70 pt-3 text-base font-semibold text-emerald-300">
              <dt>Total estimado</dt>
              <dd>HNL {totals.total.toFixed(2)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-slate-400">
            El total final puede variar según descuentos negociados o ajustes al momento de la recepción.
          </p>
        </div>
      </footer>
    </form>
  );
};

export default PurchaseOrderForm;
