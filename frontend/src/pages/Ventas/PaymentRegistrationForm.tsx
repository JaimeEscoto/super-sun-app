import { FormEvent, useMemo, useState } from 'react';

type Invoice = {
  id: string;
  cliente: string;
  canal: string;
  moneda: 'HNL' | 'USD';
  saldoPendiente: number;
  diasVencimiento: number;
};

type Payment = {
  id: string;
  fecha: string;
  monto: string;
  metodo: string;
  referencia: string;
};

const invoices: Invoice[] = [
  {
    id: 'FAC-2024-4501',
    cliente: 'Distribuidora Caribe Norte',
    canal: 'Mayorista',
    moneda: 'HNL',
    saldoPendiente: 24580,
    diasVencimiento: 12
  },
  {
    id: 'FAC-2024-4580',
    cliente: 'Hoteles Pacífico',
    canal: 'Hospitality',
    moneda: 'HNL',
    saldoPendiente: 18240,
    diasVencimiento: -3
  },
  {
    id: 'FAC-2024-4622',
    cliente: 'Exportadora Atlántida',
    canal: 'Exportación',
    moneda: 'USD',
    saldoPendiente: 8400,
    diasVencimiento: 25
  }
];

const paymentMethods = ['Transferencia bancaria', 'Tarjeta de crédito', 'Depósito bancario', 'Pago en efectivo'];

export const PaymentRegistrationForm = () => {
  const [invoiceId, setInvoiceId] = useState(invoices[0].id);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [estado, setEstado] = useState<string | null>(null);
  const [metodo, setMetodo] = useState(paymentMethods[0]);
  const [monto, setMonto] = useState('');
  const [referencia, setReferencia] = useState('');
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));

  const facturaSeleccionada = invoices.find((invoice) => invoice.id === invoiceId)!;

  const saldoRegistrado = useMemo(
    () =>
      payments.reduce((acc, payment) => acc + (Number.parseFloat(payment.monto) || 0), 0),
    [payments]
  );

  const saldoRestante = facturaSeleccionada.saldoPendiente - saldoRegistrado;

  const colorSaldo = saldoRestante <= 0 ? 'text-emerald-200' : saldoRegistrado > 0 ? 'text-amber-200' : 'text-slate-300';

  const handleAddPayment = () => {
    if (!monto || Number.parseFloat(monto) <= 0) {
      setEstado('Ingresa un monto válido para registrar el cobro.');
      return;
    }

    setPayments((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        fecha,
        monto,
        metodo,
        referencia
      }
    ]);

    setMonto('');
    setReferencia('');
    setEstado(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (payments.length === 0) {
      setEstado('Registra al menos un pago antes de aplicar el cobro.');
      return;
    }

    const totalPagado = payments.reduce((acc, payment) => acc + (Number.parseFloat(payment.monto) || 0), 0);

    setEstado(
      `Cobro registrado para ${facturaSeleccionada.id}. Total aplicado ${facturaSeleccionada.moneda} ${totalPagado.toFixed(
        2
      )}. Saldo pendiente ${facturaSeleccionada.moneda} ${(facturaSeleccionada.saldoPendiente - totalPagado).toFixed(2)}.`
    );
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">Registro de cobro</p>
        <h3 className="text-lg font-semibold text-white">Control de cartera por canal</h3>
        <p className="text-sm text-slate-300">
          Aplica pagos parciales o totales vinculados a la factura. Los saldos se actualizan por canal de venta y alimentan los
          reportes de cuentas por cobrar.
        </p>
        {estado ? (
          <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-xs text-emerald-200">{estado}</div>
        ) : null}
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Factura</label>
          <select
            value={invoiceId}
            onChange={(event) => {
              setInvoiceId(event.target.value);
              setPayments([]);
              setEstado(null);
            }}
            className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            {invoices.map((invoice) => (
              <option key={invoice.id} value={invoice.id}>
                {invoice.id} • {invoice.cliente}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-400">Canal: {facturaSeleccionada.canal}</p>
          <p className="text-[11px] text-slate-400">
            Días a vencimiento: {facturaSeleccionada.diasVencimiento >= 0 ? `${facturaSeleccionada.diasVencimiento} días` : `Vencida hace ${Math.abs(facturaSeleccionada.diasVencimiento)} días`}
          </p>
        </div>
        <div className="space-y-2 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4 text-xs text-slate-300">
          <h4 className="text-sm font-semibold text-white">Estado de cuenta</h4>
          <p>
            Saldo original: {facturaSeleccionada.moneda} {facturaSeleccionada.saldoPendiente.toFixed(2)}
          </p>
          <p>
            Pagos registrados: {facturaSeleccionada.moneda} {saldoRegistrado.toFixed(2)}
          </p>
          <p className={colorSaldo}>
            Saldo pendiente: {facturaSeleccionada.moneda} {Math.max(0, saldoRestante).toFixed(2)}
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
        <div className="space-y-4 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
          <h4 className="text-sm font-semibold text-white">Detalle de pagos</h4>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-2 text-xs text-slate-300 lg:col-span-2">
              Monto ({facturaSeleccionada.moneda})
              <input
                type="number"
                min={0}
                step="0.01"
                value={monto}
                onChange={(event) => setMonto(event.target.value)}
                className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-xs text-slate-300">
              Método
              <select
                value={metodo}
                onChange={(event) => setMetodo(event.target.value)}
                className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              >
                {paymentMethods.map((method) => (
                  <option key={method}>{method}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-xs text-slate-300">
              Fecha de pago
              <input
                type="date"
                value={fecha}
                onChange={(event) => setFecha(event.target.value)}
                className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="space-y-2 text-xs text-slate-300 lg:col-span-2">
              Referencia bancaria / nota
              <input
                type="text"
                value={referencia}
                onChange={(event) => setReferencia(event.target.value)}
                placeholder="# de transferencia o recibo"
                className="w-full rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddPayment}
              className="inline-flex items-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
            >
              Agregar pago
            </button>
          </div>

          <div className="space-y-2">
            {payments.length === 0 ? (
              <p className="text-xs text-slate-400">Aún no se han registrado pagos para esta factura.</p>
            ) : (
              <ul className="space-y-2 text-xs text-slate-300">
                {payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-900/50 px-3 py-2"
                  >
                    <span>
                      {payment.fecha} • {payment.metodo}
                      <span className="ml-2 font-semibold text-white">
                        {facturaSeleccionada.moneda} {Number.parseFloat(payment.monto).toFixed(2)}
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-400">Ref: {payment.referencia || 'N/D'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="space-y-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-50">
          <h4 className="text-sm font-semibold text-emerald-100">Resumen del cobro</h4>
          <div className="flex justify-between">
            <span>Total aplicado</span>
            <span>
              {facturaSeleccionada.moneda} {saldoRegistrado.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Saldo por aplicar</span>
            <span>
              {facturaSeleccionada.moneda} {Math.max(0, saldoRestante).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs text-emerald-100">
            <span>Pagos registrados</span>
            <span>{payments.length}</span>
          </div>
        </div>
      </section>

      <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          El registro alimenta la conciliación bancaria y actualiza la cartera por ejecutivo y canal de venta.
        </p>
        <button
          type="submit"
          className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow transition hover:bg-emerald-400"
        >
          Registrar cobro
        </button>
      </footer>
    </form>
  );
};
