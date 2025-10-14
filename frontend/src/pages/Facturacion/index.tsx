import { useQuery } from '@tanstack/react-query';

import { Column, DataTable } from '@/components/cards/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
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
    <div className="space-y-8">
      <PageHeader
        title="Facturación electrónica"
        description="Controla la emisión fiscal con CAI, numeración autorizada y cálculos automáticos de ISV multi-tasa y retenciones según normativa del SAR."
      />
      <DataTable<Factura>
        title="Facturas emitidas"
        data={data ?? []}
        columns={columns}
      />
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Facturación electrónica SAR</h3>
        <p className="text-sm text-slate-300">
          Plantillas de factura electrónica hondureña con cálculo de ISV 15%/18%, retenciones de ISR, control de CAI y numeración. Integra envío automático al SAR y soporta moneda extranjera usando tipo de cambio diario del BCH.
        </p>
      </div>
    </div>
  );
};
