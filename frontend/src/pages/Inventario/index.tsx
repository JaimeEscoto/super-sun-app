import { useQuery } from '@tanstack/react-query';

import { Column, DataTable } from '@/components/cards/DataTable';
import api from '@/lib/api';

interface Valuacion {
  producto_id: string;
  existencias: string;
  valor_total: string;
}

export const InventarioPage = () => {
  const { data } = useQuery({
    queryKey: ['inventario', 'valuacion'],
    queryFn: async () => {
      const response = await api.get<{ data: Valuacion[] }>('/inventario/valuacion');
      return response.data.data;
    }
  });

  const columns: Column<Valuacion>[] = [
    { header: 'Producto', accessor: 'producto_id' },
    { header: 'Existencias', accessor: 'existencias' },
    { header: 'Valor total', accessor: 'valor_total' }
  ];

  return (
    <div className="space-y-6">
      <DataTable<Valuacion>
        title="Valuación de inventario"
        data={data ?? []}
        columns={columns}
      />
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Control PEPS y promedio ponderado</h3>
        <p className="text-sm text-slate-300">
          Permite elegir costo predeterminado PEPS o Promedio ponderado, gestionar lotes/series y
          ejecutar conteos cíclicos con ajustes automáticos y asientos contables.
        </p>
      </div>
    </div>
  );
};
