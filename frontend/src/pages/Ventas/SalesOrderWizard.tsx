import { FormEvent, useEffect, useMemo, useState } from 'react';

type SalesOrderClient = {
  id: string;
  nombre: string;
  limiteCredito: number;
  saldoActual: number;
  moneda: 'HNL' | 'USD';
  plazoPago: string;
};

type PriceList = {
  id: string;
  nombre: string;
  moneda: 'HNL' | 'USD';
  factor: number;
  ajustes?: Record<string, number>;
};

type Product = {
  id: string;
  nombre: string;
  stock: number;
  precioBase: number;
  tasaImpuesto: number;
};

type SalesOrderItem = {
  id: string;
  productoId: string;
  cantidad: string;
  precioUnitario: string;
  descuento: string;
};

const clients: SalesOrderClient[] = [
  {
    id: 'CL-0087',
    nombre: 'Distribuidora Caribe Norte',
    limiteCredito: 75000,
    saldoActual: 46800,
    moneda: 'HNL',
    plazoPago: '30 días'
  },
  {
    id: 'CL-0142',
    nombre: 'Hoteles Pacífico',
    limiteCredito: 42000,
    saldoActual: 15400,
    moneda: 'HNL',
    plazoPago: '45 días'
  },
  {
    id: 'CL-0205',
    nombre: 'Exportadora Atlántida',
    limiteCredito: 120000,
    saldoActual: 97000,
    moneda: 'USD',
    plazoPago: '60 días'
  }
];

const priceLists: PriceList[] = [
  {
    id: 'HNL-MAY',
    nombre: 'Lista mayorista nacional (HNL)',
    moneda: 'HNL',
    factor: 1,
    ajustes: {
      'QCL-001': 0.94,
      'QCL-014': 0.97,
      'QCL-025': 0.9
    }
  },
  {
    id: 'HNL-DET',
    nombre: 'Lista distribuidores retail (HNL)',
    moneda: 'HNL',
    factor: 1.08,
    ajustes: {
      'QCL-001': 1.02,
      'QCL-014': 1,
      'QCL-025': 1.04
    }
  },
  {
    id: 'USD-EXP',
    nombre: 'Exportación CA (USD)',
    moneda: 'USD',
    factor: 0.04,
    ajustes: {
      'QCL-001': 1,
      'QCL-014': 0.98,
      'QCL-025': 1.06
    }
  }
];

const products: Product[] = [
  {
    id: 'QCL-001',
    nombre: 'Hipoclorito de sodio 50kg',
    stock: 128,
    precioBase: 1850,
    tasaImpuesto: 0.15
  },
  {
    id: 'QCL-014',
    nombre: 'Detergente neutro 20L',
    stock: 64,
    precioBase: 1425,
    tasaImpuesto: 0.18
  },
  {
    id: 'QCL-025',
    nombre: 'Desengrasante alcalino 18L',
    stock: 37,
    precioBase: 2150,
    tasaImpuesto: 0.15
  }
];

const EXCHANGE_RATE = 24.5; // HNL por 1 USD, referencia del BCH

const buildItem = (productoId = products[0].id): SalesOrderItem => ({
  id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
  productoId,
  cantidad: '10',
  precioUnitario: '0',
  descuento: '0'
});

const resolvePrice = (productoId: string, listaId: string) => {
  const producto = products.find((item) => item.id === productoId);
  const lista = priceLists.find((item) => item.id === listaId);

  if (!producto || !lista) {
    return 0;
  }

  const ajuste = lista.ajustes?.[productoId] ?? 1;
  return Number((producto.precioBase * lista.factor * ajuste).toFixed(2));
};

export const SalesOrderWizard = () => {
  const [clienteId, setClienteId] = useState<SalesOrderClient['id']>(clients[0].id);
  const [listaId, setListaId] = useState<PriceList['id']>(priceLists[0].id);
  const [items, setItems] = useState<SalesOrderItem[]>([buildItem()]);
  const [fechaPromesa, setFechaPromesa] = useState(() => new Date().toISOString().slice(0, 10));
  const [notas, setNotas] = useState('Priorizar entrega en ruta norte, confirmar disponibilidad de pallets retornables.');
  const [estado, setEstado] = useState<string | null>(null);

  useEffect(() => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        precioUnitario: resolvePrice(item.productoId, listaId).toFixed(2)
      }))
    );
  }, [listaId]);

  const selectedClient = useMemo(() => clients.find((client) => client.id === clienteId) ?? clients[0], [clienteId]);
  const selectedPriceList = useMemo(() => priceLists.find((list) => list.id === listaId) ?? priceLists[0], [listaId]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let impuestos = 0;
    const alertasInventario: string[] = [];

    for (const item of items) {
      const producto = products.find((product) => product.id === item.productoId);
      if (!producto) {
        continue;
      }

      const cantidad = Number.parseFloat(item.cantidad) || 0;
      const precio = Number.parseFloat(item.precioUnitario) || 0;
      const descuento = Number.parseFloat(item.descuento) || 0;
      const precioConDescuento = precio * (1 - descuento / 100);

      subtotal += cantidad * precioConDescuento;
      impuestos += cantidad * precioConDescuento * producto.tasaImpuesto;

      if (cantidad > producto.stock) {
        alertasInventario.push(
          `${producto.nombre}: solicitado ${cantidad.toFixed(2)} vs disponible ${producto.stock.toFixed(2)} unidades`
        );
      }
    }

    const total = subtotal + impuestos;

    return { subtotal, impuestos, total, alertasInventario };
  }, [items]);

  const totalEnMonedaCliente = useMemo(() => {
    if (selectedClient.moneda === selectedPriceList.moneda) {
      return totals.total;
    }

    if (selectedClient.moneda === 'HNL' && selectedPriceList.moneda === 'USD') {
      return totals.total * EXCHANGE_RATE;
    }

    return totals.total / EXCHANGE_RATE;
  }, [selectedClient.moneda, selectedPriceList.moneda, totals.total]);

  const creditoDisponible = selectedClient.limiteCredito - selectedClient.saldoActual;
  const creditoSuficiente = totalEnMonedaCliente <= creditoDisponible;

  const handleItemChange = (id: string, field: keyof SalesOrderItem, value: string) => {
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

  const handleProductoChange = (id: string, productoId: string) => {
    const nuevoPrecio = resolvePrice(productoId, listaId).toFixed(2);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              productoId,
              precioUnitario: nuevoPrecio
            }
          : item
      )
    );
  };

  const handleAgregarItem = () => {
    setItems((prev) => [
      ...prev,
      {
        ...buildItem(products[Math.min(prev.length, products.length - 1)].id),
        precioUnitario: resolvePrice(products[Math.min(prev.length, products.length - 1)].id, listaId).toFixed(2)
      }
    ]);
  };

  const handleEliminarItem = (id: string) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== id)));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (totals.alertasInventario.length > 0) {
      setEstado('Ajusta las cantidades. Hay partidas que superan el stock disponible.');
      return;
    }

    if (!creditoSuficiente) {
      setEstado('Pedido condicionado: supera el crédito disponible, requiere autorización del gerente comercial.');
      return;
    }

    setEstado(
      `Pedido PV-${new Date().getFullYear()}-${Math.floor(Math.random() * 999)
        .toString()
        .padStart(3, '0')} listo para confirmar. Total ${selectedPriceList.moneda} ${totals.total.toFixed(
        2
      )} con promesa de entrega ${fechaPromesa}.`
    );
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">Pedido de venta</p>
        <h3 className="text-lg font-semibold text-white">Captura con control comercial</h3>
        <p className="text-sm text-slate-300">
          Selecciona cliente, lista de precio y partidas. La validación de inventario y crédito asegura condiciones autorizadas
          antes de comprometer la entrega.
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
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nombre} • {client.id}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Lista de precios</label>
          <select
            value={listaId}
            onChange={(event) => setListaId(event.target.value)}
            className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            {priceLists.map((list) => (
              <option key={list.id} value={list.id}>
                {list.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Promesa de entrega</label>
          <input
            type="date"
            value={fechaPromesa}
            onChange={(event) => setFechaPromesa(event.target.value)}
            className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Notas comerciales</label>
          <textarea
            value={notas}
            onChange={(event) => setNotas(event.target.value)}
            className="h-24 w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">Partidas del pedido</h4>
          <button
            type="button"
            onClick={handleAgregarItem}
            className="inline-flex items-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
          >
            Agregar partida
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item) => {
            const producto = products.find((product) => product.id === item.productoId)!;
            const cantidad = Number.parseFloat(item.cantidad) || 0;
            const precio = Number.parseFloat(item.precioUnitario) || 0;
            const descuento = Number.parseFloat(item.descuento) || 0;
            const valorLinea = cantidad * precio * (1 - descuento / 100);

            return (
              <div
                key={item.id}
                className="grid gap-3 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4 md:grid-cols-[2fr,repeat(4,minmax(0,1fr))]"
              >
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Producto</label>
                  <select
                    value={item.productoId}
                    onChange={(event) => handleProductoChange(item.id, event.target.value)}
                    className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">Stock disponible: {producto.stock} unidades</p>
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
                  <p className="text-[11px] text-slate-500">Se actualiza con la lista seleccionada.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Descuento %</label>
                  <input
                    type="number"
                    min={0}
                    max={25}
                    step="0.5"
                    value={item.descuento}
                    onChange={(event) => handleItemChange(item.id, 'descuento', event.target.value)}
                    className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col justify-between gap-2">
                  <div className="text-xs text-slate-300">
                    Valor línea
                    <span className="block text-base font-semibold text-white">
                      {selectedPriceList.moneda} {valorLinea.toFixed(2)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEliminarItem(item.id)}
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
          <h4 className="text-sm font-semibold text-white">Validaciones del flujo</h4>
          <div className="text-xs text-slate-300">
            <p>
              Crédito disponible {selectedClient.moneda} {creditoDisponible.toFixed(2)} • saldo vigente {selectedClient.moneda}{' '}
              {selectedClient.saldoActual.toFixed(2)}
            </p>
            <p>
              Total pedido {selectedPriceList.moneda} {totals.total.toFixed(2)}{' '}
              {selectedClient.moneda !== selectedPriceList.moneda
                ? `(equivalente ${selectedClient.moneda} ${totalEnMonedaCliente.toFixed(2)})`
                : null}
            </p>
            <p className={creditoSuficiente ? 'text-emerald-200' : 'text-amber-200'}>
              {creditoSuficiente
                ? 'Dentro del límite de crédito autorizado.'
                : 'Excede el crédito disponible. Solicita autorización.'}
            </p>
            <p>Plazo de pago: {selectedClient.plazoPago}</p>
          </div>
          {totals.alertasInventario.length > 0 ? (
            <ul className="space-y-1 text-xs text-amber-200">
              {totals.alertasInventario.map((alerta) => (
                <li key={alerta}>⚠️ {alerta}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-emerald-200">Inventario suficiente para todas las partidas.</p>
          )}
        </div>
        <div className="space-y-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
          <h4 className="text-sm font-semibold text-emerald-100">Resumen económico</h4>
          <dl className="space-y-1 text-sm text-emerald-100">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>
                {selectedPriceList.moneda} {totals.subtotal.toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Impuestos</dt>
              <dd>
                {selectedPriceList.moneda} {totals.impuestos.toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between font-semibold text-emerald-50">
              <dt>Total pedido</dt>
              <dd>
                {selectedPriceList.moneda} {totals.total.toFixed(2)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          La confirmación actualiza el backlog de producción, reserva inventario y sincroniza con compromisos logísticos.
        </p>
        <button
          type="submit"
          className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow transition hover:bg-emerald-400"
        >
          Crear pedido
        </button>
      </footer>
    </form>
  );
};
