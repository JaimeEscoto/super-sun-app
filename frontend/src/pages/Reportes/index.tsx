import { useQuery } from '@tanstack/react-query';

import { DataTable } from '@/components/cards/DataTable';
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
      const response = await api.get<{ tipo: string; tramo: string; total: string }[]>(
        '/reportes/cartera'
      );
      return response.data;
    }
  });

  return (
    <div className="space-y-6">
      <DataTable
        title="Aging CxC/CxP"
        data={(data ?? []) as ReporteCartera[]}
        columns={[
          { header: 'Tipo', accessor: 'tipo' },
          { header: 'Tramo', accessor: 'tramo' },
          { header: 'Total', accessor: 'total' }
        ]}
      />
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Reportes financieros</h3>
        <p className="text-sm text-slate-300">
          Incluye reportes de ventas por cliente/mes, productos top, cumplimiento de compras,
          valorización de inventario, aging de cartera, balanza, estado de resultados y balance
          general exportables a Excel/PDF.
        </p>
      </div>
    </div>
  );
};
