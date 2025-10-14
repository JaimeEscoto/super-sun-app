import { useQuery } from '@tanstack/react-query';
import { Banknote, Boxes, ChartLine, Users } from 'lucide-react';

import { TransactionQuickActions } from '@/components/cards/TransactionQuickActions';
import { SalesChart } from '@/components/charts/SalesChart';
import { StatCard } from '@/components/cards/StatCard';
import api from '@/lib/api';

interface DashboardMetrics {
  ventasMes: string;
  margen: string;
  inventarioDias: string;
  carteraVencida: string;
}

export const DashboardPage = () => {
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get<DashboardMetrics>('/reportes/resumen');
      return response.data;
    },
    staleTime: 60 * 1000
  });

  const metrics = data ?? {
    ventasMes: 'L 0',
    margen: 'L 0',
    inventarioDias: '0',
    carteraVencida: 'L 0'
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Ventas del mes" value={metrics.ventasMes} icon={<ChartLine className="text-primary" />} />
        <StatCard title="Margen bruto" value={metrics.margen} icon={<Banknote className="text-primary" />} />
        <StatCard title="Rotación inventario" value={`${metrics.inventarioDias} días`} icon={<Boxes className="text-primary" />} />
        <StatCard title="Cartera vencida" value={metrics.carteraVencida} icon={<Users className="text-primary" />} />
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <SalesChart />
        <TransactionQuickActions />
      </section>
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Alertas operativas</h3>
        <ul className="space-y-3 text-sm text-slate-300">
          <li>• 3 pedidos pendientes de aprobación de crédito y RTN.</li>
          <li>• 2 órdenes de compra exceden presupuestos en lempiras.</li>
          <li>• 5 productos con stock por debajo del mínimo regional.</li>
          <li>• 1 factura electrónica pendiente de envío al SAR.</li>
        </ul>
      </div>
    </div>
  );
};
