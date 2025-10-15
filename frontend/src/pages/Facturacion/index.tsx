import { useQuery } from '@tanstack/react-query';
import { FileCheck, FileSearch, ReceiptText, Stamp } from 'lucide-react';

import { ActionMenuCard } from '@/components/cards/ActionMenuCard';
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
      <div className="grid gap-6 lg:grid-cols-[320px,1fr] xl:grid-cols-[360px,1fr]">
        <ActionMenuCard
          title="Menú de facturación"
          description="Centraliza las opciones de emisión fiscal para agilizar el proceso de facturas electrónicas."
          items={[
            {
              title: 'Factura electrónica',
              description: 'Genera una factura con numeración CAI, cálculo de ISV y envío automático al SAR.',
              icon: ReceiptText,
              actionLabel: 'Emitir factura'
            },
            {
              title: 'Nota de crédito',
              description: 'Aplica devoluciones y descuentos con referencia a la factura original y control de correlativos.',
              icon: FileCheck,
              actionLabel: 'Crear nota'
            },
            {
              title: 'Nota de débito',
              description: 'Registra cargos adicionales con impuestos calculados y actualización de cuentas por cobrar.',
              icon: Stamp,
              actionLabel: 'Agregar cargo'
            },
            {
              title: 'Consultas de autorización',
              description: 'Revisa el estado de autorización, expiración del CAI y consecutivos disponibles.',
              icon: FileSearch,
              actionLabel: 'Consultar CAI'
            }
          ]}
          footer="Los documentos tributarios se integran con contabilidad, cartera y reportes exigidos por el SAR en tiempo real."
        />
        <div className="space-y-6">
          <DataTable<Factura> title="Facturas emitidas" data={data ?? []} columns={columns} />
          <div className="card p-6 space-y-3">
            <h3 className="text-lg font-semibold text-white">Facturación electrónica SAR</h3>
            <p className="text-sm text-slate-300">
              Plantillas de factura electrónica hondureña con cálculo de ISV 15%/18%, retenciones de ISR, control de CAI y numeración. Integra envío automático al SAR y soporta moneda extranjera usando tipo de cambio diario del BCH.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
