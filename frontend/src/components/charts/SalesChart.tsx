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
    <div className="card p-6 h-80">
      <h3 className="text-lg font-semibold text-white mb-4">Ventas por cliente</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data ?? []}>
          <defs>
            <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="cliente_id" stroke="#cbd5f5" tickLine={false} axisLine={{ stroke: '#1e293b' }} />
          <YAxis stroke="#cbd5f5" tickLine={false} axisLine={{ stroke: '#1e293b' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0b172a', border: '1px solid #1e293b', color: '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="total_ventas"
            stroke="#1d4ed8"
            fillOpacity={1}
            fill="url(#colorVentas)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
