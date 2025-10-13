import { useQuery } from '@tanstack/react-query';

import { DataTable } from '@/components/cards/DataTable';
import api from '@/lib/api';

interface Pedido {
  id: string;
  cliente_id: string;
  fecha: string;
  estado: string;
  total: string;
  moneda: string;
}

export const VentasPage = () => {
  const { data } = useQuery({
    queryKey: ['ventas', 'pedidos'],
    queryFn: async () => {
      const response = await api.get<{ data: Pedido[] }>('/ventas/pedidos');
      return response.data.data;
    }
  });

  return (
    <div className="space-y-6">
      <DataTable
        title="Pedidos de venta"
        data={data ?? []}
        columns={[
          { header: 'Pedido', accessor: 'id' },
          { header: 'Cliente', accessor: 'cliente_id' },
          { header: 'Fecha', accessor: 'fecha' },
          { header: 'Estado', accessor: 'estado' },
          { header: 'Total', accessor: 'total' },
          { header: 'Moneda', accessor: 'moneda' }
        ]}
      />
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Política comercial</h3>
        <p className="text-sm text-slate-300">
          Se valida el límite de crédito, listas de precios segmentadas, descuentos por volumen y
          promociones aplicables según canal de venta. Integra reservas de inventario y picking.
        </p>
      </div>
    </div>
  );
};
