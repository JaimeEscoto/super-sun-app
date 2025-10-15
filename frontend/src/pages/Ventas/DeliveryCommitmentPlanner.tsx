import { FormEvent, useMemo, useState } from 'react';

type DeliveryMilestone = {
  id: string;
  nombre: string;
  descripcion: string;
  responsable: string;
  completado: boolean;
};

const warehouses = ['Bodega San Pedro Sula', 'Planta Choloma', 'Centro distribución Tegucigalpa'];
const transportistas = ['Transporte Ruta Norte', 'Paquetería Express HN', 'Flota propia - Furgón 3'];
const ventanasEntrega = ['Mañana (8:00 - 12:00)', 'Tarde (13:00 - 17:00)', 'Horario extendido'];
const rutas = ['Ruta norte • SPS - La Ceiba', 'Ruta central • SPS - Tegucigalpa', 'Exportación CA • SPS - San Salvador'];

const buildMilestones = (): DeliveryMilestone[] => [
  {
    id: 'picking',
    nombre: 'Picking',
    descripcion: 'Confirmar ubicación y lote. Asignar operarios con RF scanning.',
    responsable: 'Almacén',
    completado: true
  },
  {
    id: 'packing',
    nombre: 'Packing',
    descripcion: 'Embalaje con checklist de calidad y impresión de etiquetas.',
    responsable: 'Control de calidad',
    completado: false
  },
  {
    id: 'transporte',
    nombre: 'Transporte',
    descripcion: 'Asignar unidad y sellar documento de despacho.',
    responsable: 'Logística',
    completado: false
  }
];

export const DeliveryCommitmentPlanner = () => {
  const [orden, setOrden] = useState('PV-2024-145');
  const [bodega, setBodega] = useState(warehouses[0]);
  const [ruta, setRuta] = useState(rutas[0]);
  const [transportista, setTransportista] = useState(transportistas[0]);
  const [ventana, setVentana] = useState(ventanasEntrega[0]);
  const [fechaSalida, setFechaSalida] = useState(() => new Date().toISOString().slice(0, 10));
  const [tracking, setTracking] = useState('TRK-');
  const [notas, setNotas] = useState('Confirmar temperatura controlada y pallets plásticos.');
  const [milestones, setMilestones] = useState<DeliveryMilestone[]>(buildMilestones);
  const [estado, setEstado] = useState<string | null>(null);

  const avance = useMemo(() => {
    const total = milestones.length;
    const completados = milestones.filter((milestone) => milestone.completado).length;
    return Math.round((completados / total) * 100);
  }, [milestones]);

  const handleToggleMilestone = (id: string) => {
    setMilestones((prev) =>
      prev.map((milestone) =>
        milestone.id === id
          ? {
              ...milestone,
              completado: !milestone.completado
            }
          : milestone
      )
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const faltantes = milestones.filter((milestone) => !milestone.completado).map((milestone) => milestone.nombre);

    if (faltantes.length > 0) {
      setEstado(`Pendiente completar: ${faltantes.join(', ')}.`);
      return;
    }

    setEstado(
      `Entrega programada. Salida ${fechaSalida} desde ${bodega} con ${transportista}. Tracking ${tracking || 'por confirmar'}.`
    );
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">Compromiso de entrega</p>
        <h3 className="text-lg font-semibold text-white">Planificación de despacho</h3>
        <p className="text-sm text-slate-300">
          Coordina picking, packing y transporte para cumplir la promesa con el cliente. Cada hito actualiza indicadores de
          servicio y alimenta el seguimiento en ruta.
        </p>
        {estado ? (
          <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-xs text-emerald-200">{estado}</div>
        ) : null}
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Pedido relacionado</label>
          <input
            type="text"
            value={orden}
            onChange={(event) => setOrden(event.target.value)}
            className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Bodega de salida</label>
          <select
            value={bodega}
            onChange={(event) => setBodega(event.target.value)}
            className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            {warehouses.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Ruta</label>
          <select
            value={ruta}
            onChange={(event) => setRuta(event.target.value)}
            className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            {rutas.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Transportista</label>
          <select
            value={transportista}
            onChange={(event) => setTransportista(event.target.value)}
            className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            {transportistas.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Ventana de entrega</label>
          <select
            value={ventana}
            onChange={(event) => setVentana(event.target.value)}
            className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          >
            {ventanasEntrega.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Fecha de salida</label>
          <input
            type="date"
            value={fechaSalida}
            onChange={(event) => setFechaSalida(event.target.value)}
            className="w-full rounded-xl border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.3fr,1fr]">
        <div className="space-y-4 rounded-xl border border-slate-800/70 bg-slate-900/60 p-4">
          <h4 className="text-sm font-semibold text-white">Hitos operativos</h4>
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <label key={milestone.id} className="flex gap-3 rounded-lg border border-slate-800/60 bg-slate-900/50 p-3 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={milestone.completado}
                  onChange={() => handleToggleMilestone(milestone.id)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">{milestone.nombre}</span>
                  {milestone.descripcion}
                  <span className="mt-1 block text-[11px] text-slate-400">Responsable: {milestone.responsable}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
          <h4 className="text-sm font-semibold text-emerald-100">Seguimiento</h4>
          <p className="text-xs text-emerald-50">Avance del proceso: {avance}%</p>
          <label className="space-y-2 text-xs text-emerald-50">
            Tracking transporte
            <input
              type="text"
              value={tracking}
              onChange={(event) => setTracking(event.target.value)}
              placeholder="TRK-000001"
              className="w-full rounded-lg border border-emerald-500/40 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </label>
          <label className="space-y-2 text-xs text-emerald-50">
            Indicaciones al transportista
            <textarea
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
              className="h-24 w-full rounded-lg border border-emerald-500/40 bg-slate-900/70 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>
        </div>
      </section>

      <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          La planificación sincroniza reservas de inventario, avisos de salida de bodega y seguimiento GPS para el cliente.
        </p>
        <button
          type="submit"
          className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow transition hover:bg-emerald-400"
        >
          Planificar entrega
        </button>
      </footer>
    </form>
  );
};
