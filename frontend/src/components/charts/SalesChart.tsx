import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import api from '@/lib/api';

interface SalesPoint {
  cliente_id: string;
  total_ventas: number;
  margen: number;
}

export const SalesChart = () => {
  const { data } = useQuery({
    queryKey: ['reportes', 'ventas'],
    queryFn: async () => {
      const response = await api.get<{ data: SalesPoint[] }>('/reportes/ventas');
      return response.data.data;
    }
  });

  return (
    <div className="relative h-80 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-100 shadow-[0_35px_80px_-45px_rgba(59,130,246,0.7)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_55%)]" />
      <div className="relative mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">Comercial</p>
          <h3 className="text-lg font-semibold text-white">Ventas por cliente</h3>
        </div>
        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">Tiempo real</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data ?? []}>
          <defs>
            <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
          <XAxis dataKey="cliente_id" stroke="#e2e8f0" tickLine={false} axisLine={{ stroke: 'rgba(148, 163, 184, 0.25)' }} />
          <YAxis stroke="#e2e8f0" tickLine={false} axisLine={{ stroke: 'rgba(148, 163, 184, 0.25)' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              color: '#f8fafc'
            }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Area
            type="monotone"
            dataKey="total_ventas"
            stroke="#60a5fa"
            fillOpacity={1}
            fill="url(#colorVentas)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
