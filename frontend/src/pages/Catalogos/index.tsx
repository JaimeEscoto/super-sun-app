import { useQuery } from '@tanstack/react-query';

import { DataTable } from '@/components/cards/DataTable';
import api from '@/lib/api';

interface Cliente {
  id: string;
  codigo: string;
  razon_social: string;
  nif: string;
  limite_credito: string;
  saldo: string;
  estado: string;
}

export const CatalogosPage = () => {
  const { data } = useQuery({
    queryKey: ['catalogos', 'clientes'],
    queryFn: async () => {
      const response = await api.get<{ data: Cliente[] }>('/catalogos/clientes');
      return response.data.data;
    }
  });

  return (
    <div className="space-y-6">
      <DataTable
        title="Clientes activos"
        data={data ?? []}
        columns={[
          { header: 'Código', accessor: 'codigo' },
          { header: 'Razón social', accessor: 'razon_social' },
          { header: 'RFC', accessor: 'nif' },
          { header: 'Límite crédito', accessor: 'limite_credito' },
          { header: 'Saldo', accessor: 'saldo' },
          { header: 'Estado', accessor: 'estado' }
        ]}
      />
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Políticas de crédito</h3>
        <p className="text-sm text-slate-300">
          Se evalúa automáticamente el límite de crédito, días de mora y retenciones aplicables por
          cliente según el régimen fiscal mexicano.
        </p>
      </div>
    </div>
  );
};
