import { useQuery } from '@tanstack/react-query';

import { Column, DataTable } from '@/components/cards/DataTable';
import api from '@/lib/api';

interface OrdenCompra {
  id: string;
  proveedor_id: string;
  fecha: string;
  estado: string;
  moneda: string;
  total: string;
}

export const ComprasPage = () => {
  const { data } = useQuery({
    queryKey: ['compras', 'ordenes'],
    queryFn: async () => {
      const response = await api.get<{ data: OrdenCompra[] }>('/compras/ordenes');
      return response.data.data;
    }
  });

  const columns: Column<OrdenCompra>[] = [
    { header: 'OC', accessor: 'id' },
    { header: 'Proveedor', accessor: 'proveedor_id' },
    { header: 'Fecha', accessor: 'fecha' },
    { header: 'Estado', accessor: 'estado' },
    { header: 'Moneda', accessor: 'moneda' },
    { header: 'Total', accessor: 'total' }
  ];

  return (
    <div className="space-y-6">
      <DataTable<OrdenCompra>
        title="Órdenes de compra"
        data={data ?? []}
        columns={columns}
      />
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Workflow de compras</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
          <li>Solicitud de compra con validación de presupuesto.</li>
          <li>Orden de compra con aprobación automática por monto.</li>
          <li>Recepción actualiza stock y costo promedio.</li>
          <li>Factura de proveedor genera CxP y retenciones locales (ISV 15%, ISV 18%, exento).</li>
        </ol>
      </div>
    </div>
  );
};
