import { useQuery } from '@tanstack/react-query';

import { Column, DataTable } from '@/components/cards/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
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

  const columns: Column<Pedido>[] = [
    { header: 'Pedido', accessor: 'id' },
    { header: 'Cliente', accessor: 'cliente_id' },
    { header: 'Fecha', accessor: 'fecha' },
    { header: 'Estado', accessor: 'estado' },
    { header: 'Total', accessor: 'total' },
    { header: 'Moneda', accessor: 'moneda' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ventas y relaciones"
        description="Gestiona pedidos, seguimiento de clientes y cumplimiento comercial con reglas de crédito, listas de precio y promociones regionales."
      />
      <DataTable<Pedido>
        title="Pedidos de venta"
        data={data ?? []}
        columns={columns}
      />
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Política comercial</h3>
        <p className="text-sm text-slate-300">
          Se valida el límite de crédito, listas de precios segmentadas, descuentos por volumen y promociones aplicables según canal de venta, considerando reglas de ISV y exoneraciones hondureñas. Integra reservas de inventario y picking.
        </p>
      </div>
    </div>
  );
};
