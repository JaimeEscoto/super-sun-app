import { useQuery } from '@tanstack/react-query';

import { Column, DataTable } from '@/components/cards/DataTable';
import api from '@/lib/api';

interface Asiento {
  id: string;
  fecha: string;
  diario: string;
  descripcion: string;
  total_debe: string;
  total_haber: string;
}

export const ContabilidadPage = () => {
  const { data } = useQuery({
    queryKey: ['contabilidad', 'asientos'],
    queryFn: async () => {
      const response = await api.get<{ data: Asiento[] }>('/contabilidad/asientos');
      return response.data.data;
    }
  });

  const columns: Column<Asiento>[] = [
    { header: 'Fecha', accessor: 'fecha' },
    { header: 'Diario', accessor: 'diario' },
    { header: 'Descripción', accessor: 'descripcion' },
    { header: 'Debe', accessor: 'total_debe' },
    { header: 'Haber', accessor: 'total_haber' }
  ];

  return (
    <div className="space-y-6">
      <DataTable<Asiento>
        title="Diario general"
        data={data ?? []}
        columns={columns}
      />
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Cierres y estados financieros</h3>
        <p className="text-sm text-slate-300">
          Automatiza provisiones, depreciaciones y conciliación bancaria. Genera balanza, estado de
          resultados y flujo de efectivo (método indirecto) con soporte de centros de costo.
        </p>
      </div>
    </div>
  );
};
