import { FormEvent, useMemo, useState } from 'react';

type ProformaItem = {
  id: string;
  descripcion: string;
  cantidad: string;
  precioUnitario: string;
  tasaImpuesto: number;
};

type Cliente = {
  id: string;
  nombre: string;
  contacto: string;
  correo: string;
};

const clientes: Cliente[] = [
  {
    id: 'CL-0087',
    nombre: 'Distribuidora Caribe Norte',
    contacto: 'Laura Andrade',
    correo: 'landrade@caribenorte.hn'
  },
  {
    id: 'CL-0321',
    nombre: 'Supermercados Colonial',
    contacto: 'Miguel Reyes',
    correo: 'mreyes@colonial.hn'
  },
  {
    id: 'CL-0205',
    nombre: 'Exportadora Atlántida',
    contacto: 'Pilar López',
    correo: 'plopez@exportadora.hn'
  }
];

const buildItem = (descripcion: string, precio: number, tasaImpuesto: number): ProformaItem => ({
  id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
  descripcion,
  cantidad: '1',
  precioUnitario: precio.toFixed(2),
  tasaImpuesto
});

const defaultItems = [
  buildItem('Hipoclorito de sodio 50kg', 1685, 0.15),
  buildItem('Detergente neutro 20L', 1370, 0.18)
];

export const ProformaInvoiceGenerator = () => {
  const [clienteId, setClienteId] = useState(clientes[0].id);
  const [validez, setValidez] = useState('7 días');
  const [condiciones, setCondiciones] = useState('Pago 50% anticipo, saldo contra entrega.');
  const [descuento, setDescuento] = useState('5');
  const [gastosEnvio, setGastosEnvio] = useState('450.00');
  const [observaciones, setObservaciones] = useState('Precios incluyen empaque retornable y capacitación de uso segura.');
  const [items, setItems] = useState<ProformaItem[]>(defaultItems);
  const [estado, setEstado] = useState<string | null>(null);

  const { subtotal, descuentoValor, impuestos, total } = useMemo(() => {
    let subtotalAcumulado = 0;
    let impuestosAcumulados = 0;

    for (const item of items) {
      const cantidad = Number.parseFloat(item.cantidad) || 0;
      const precio = Number.parseFloat(item.precioUnitario) || 0;
      subtotalAcumulado += cantidad * precio;
      impuestosAcumulados += cantidad * precio * item.tasaImpuesto;
    }

    const descuentoAplicado = subtotalAcumulado * ((Number.parseFloat(descuento) || 0) / 100);
    const total = subtotalAcumulado - descuentoAplicado + impuestosAcumulados + (Number.parseFloat(gastosEnvio) || 0);

    return {
      subtotal: subtotalAcumulado,
      descuentoValor: descuentoAplicado,
      impuestos: impuestosAcumulados,
      total
    };
  }, [descuento, gastosEnvio, items]);

  const handleItemChange = (id: string, field: keyof ProformaItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: field === 'tasaImpuesto' ? Number(value) : (value as string)
            }
          : item
      )
    );
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      buildItem('Producto personalizado', 900, 0.15)
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setEstado(
      `Proforma generada para ${clientes.find((cliente) => cliente.id === clienteId)?.nombre} con un total de HNL ${total.toFixed(
        2
      )}. Enviada para aprobación del cliente.`
    );
  };

  const clienteSeleccionado = clientes.find((cliente) => cliente.id === clienteId)!;

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">Factura proforma</p>
        <h3 className="text-lg font-semibold text-white">Desglose comercial para aprobación</h3>
        <p className="text-sm text-slate-300">
          Ajusta impuestos, descuentos y condiciones antes de enviar al cliente. Se genera PDF con detalle de partidas, validez
          y condiciones negociadas.
        </p>
        {estado ? (
          <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-xs text-emerald-200">{estado}</div>
        ) : null}
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Cliente</label>
          <select
            value={clienteId}
            onChange={(event) => setClienteId(event.target.value)}
            className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} • {cliente.id}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400">Contacto: {clienteSeleccionado.contacto} • {clienteSeleccionado.correo}</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Validez de oferta</label>
          <input
            type="text"
            value={validez}
            onChange={(event) => setValidez(event.target.value)}
            className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Condiciones comerciales</label>
          <textarea
            value={condiciones}
            onChange={(event) => setCondiciones(event.target.value)}
            className="h-20 w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">Conceptos de la proforma</h4>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
          >
            Agregar concepto
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4 md:grid-cols-[2fr,repeat(3,minmax(0,1fr))]"
            >
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Descripción</label>
                <input
                  type="text"
                  value={item.descripcion}
                  onChange={(event) => handleItemChange(item.id, 'descripcion', event.target.value)}
                  className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Cantidad</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.cantidad}
                  onChange={(event) => handleItemChange(item.id, 'cantidad', event.target.value)}
                  className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Precio unitario</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.precioUnitario}
                  onChange={(event) => handleItemChange(item.id, 'precioUnitario', event.target.value)}
                  className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Impuesto</label>
                <select
                  value={item.tasaImpuesto}
                  onChange={(event) => handleItemChange(item.id, 'tasaImpuesto', event.target.value)}
                  className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value={0}>Exento</option>
                  <option value={0.15}>ISV 15%</option>
                  <option value={0.18}>ISV 18%</option>
                </select>
              </div>
              <div className="flex flex-col justify-between gap-2 md:col-span-4 lg:col-span-1">
                <span className="text-xs text-slate-300">
                  Valor línea
                  <span className="block text-base font-semibold text-white">
                    HNL {(Number(item.cantidad || 0) * Number(item.precioUnitario || 0)).toFixed(2)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <div className="space-y-3 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4 text-xs text-slate-300">
          <h4 className="text-sm font-semibold text-white">Notas y descuentos</h4>
          <label className="space-y-1">
            Descuento aplicado (%)
            <input
              type="number"
              min={0}
              max={25}
              step="0.5"
              value={descuento}
              onChange={(event) => setDescuento(event.target.value)}
              className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1">
            Gastos de envío
            <input
              type="number"
              min={0}
              step="0.01"
              value={gastosEnvio}
              onChange={(event) => setGastosEnvio(event.target.value)}
              className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label className="space-y-1">
            Observaciones adicionales
            <textarea
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              className="h-24 w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>
        </div>
        <div className="space-y-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-50">
          <h4 className="text-sm font-semibold text-emerald-100">Resumen financiero</h4>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>HNL {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Descuento</span>
            <span>- HNL {descuentoValor.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Impuestos</span>
            <span>HNL {impuestos.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Gastos de envío</span>
            <span>HNL {(Number.parseFloat(gastosEnvio) || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-emerald-50">
            <span>Total proforma</span>
            <span>HNL {total.toFixed(2)}</span>
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          La proforma se publica en el portal del cliente y alimenta el pipeline comercial mientras se espera confirmación.
        </p>
        <button
          type="submit"
          className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow transition hover:bg-emerald-400"
        >
          Emitir proforma
        </button>
      </footer>
    </form>
  );
};
