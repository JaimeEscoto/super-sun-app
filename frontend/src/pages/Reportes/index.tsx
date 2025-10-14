import { useQuery } from '@tanstack/react-query';

import { Column, DataTable } from '@/components/cards/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import api from '@/lib/api';

interface ReporteCartera {
  tipo: string;
  tramo: string;
  total: string;
}

export const ReportesPage = () => {
  const { data } = useQuery({
    queryKey: ['reportes', 'cartera'],
    queryFn: async () => {
      const response = await api.get<ReporteCartera[]>('/reportes/cartera');
      return response.data;
    }
  });

  const columns: Column<ReporteCartera>[] = [
    { header: 'Tipo', accessor: 'tipo' },
    { header: 'Tramo', accessor: 'tramo' },
    { header: 'Total', accessor: 'total' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analítica financiera"
        description="Explora reportes ejecutivos y operativos: aging de cartera, ventas por cliente, compras presupuestarias y estados financieros consolidados."
      />
      <DataTable<ReporteCartera>
        title="Aging CxC/CxP"
        data={data ?? []}
        columns={columns}
      />
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Reportes financieros</h3>
        <p className="text-sm text-slate-300">
          Incluye reportes de ventas por cliente/mes, productos top, cumplimiento de compras, valorización de inventario, aging de cartera, balanza, estado de resultados y balance general exportables a Excel/PDF con parámetros fiscales para Honduras.
        </p>
      </div>
    </div>
  );
};
