import { useQuery } from '@tanstack/react-query';

import { Column, DataTable } from '@/components/cards/DataTable';
import api from '@/lib/api';

interface Factura {
  id: string;
  numero: string;
  cliente_id: string;
  fecha_emision: string;
  moneda: string;
  total: string;
  estado: string;
}

export const FacturacionPage = () => {
  const { data } = useQuery({
    queryKey: ['facturacion', 'facturas'],
    queryFn: async () => {
      const response = await api.get<{ data: Factura[] }>('/facturacion/facturas');
      return response.data.data;
    }
  });

  const columns: Column<Factura>[] = [
    { header: 'Número', accessor: 'numero' },
    { header: 'Cliente', accessor: 'cliente_id' },
    { header: 'Emisión', accessor: 'fecha_emision' },
    { header: 'Moneda', accessor: 'moneda' },
    { header: 'Total', accessor: 'total' },
    { header: 'Estado', accessor: 'estado' }
  ];

  return (
    <div className="space-y-6">
      <DataTable<Factura>
        title="Facturas emitidas"
        data={data ?? []}
        columns={columns}
      />
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Facturación electrónica SAT</h3>
        <p className="text-sm text-slate-300">
          Plantillas CFDI 4.0 con cálculo de IVA 16%/8%, retenciones ISR/IVA, numeración controlada
          y timbrado integrado mediante API. Soporta comprobantes en moneda extranjera con tipo de
          cambio diario BANXICO.
        </p>
      </div>
    </div>
  );
};
