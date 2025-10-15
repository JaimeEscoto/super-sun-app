import { useQuery } from '@tanstack/react-query';
import { ClipboardList, FileSpreadsheet, ReceiptText, Truck } from 'lucide-react';

import { ActionMenuCard } from '@/components/cards/ActionMenuCard';
import { Column, DataTable } from '@/components/cards/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
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
    <div className="space-y-8">
      <PageHeader
        title="Compras estratégicas"
        description="Supervisa el ciclo de abastecimiento: requisiciones, órdenes, recepciones y facturas de proveedor con presupuesto y retenciones hondureñas."
      />
      <div className="grid gap-6 lg:grid-cols-[320px,1fr] xl:grid-cols-[360px,1fr]">
        <ActionMenuCard
          title="Menú de abastecimiento"
          description="Define qué deseas registrar y el sistema abrirá el formulario correspondiente en el panel principal."
          items={[
            {
              title: 'Requisición interna',
              description:
                'Captura las necesidades por centro de costo y envíalas para validación automática del presupuesto asignado.',
              icon: ClipboardList,
              actionLabel: 'Crear requisición'
            },
            {
              title: 'Orden de compra',
              description:
                'Genera la orden con el proveedor seleccionado, condiciones de pago y retenciones configuradas para Honduras.',
              icon: FileSpreadsheet,
              actionLabel: 'Emitir orden'
            },
            {
              title: 'Recepción de mercancía',
              description: 'Agenda la entrada a bodega y actualiza inventario con control de lotes y costos promedio.',
              icon: Truck,
              actionLabel: 'Registrar recepción'
            },
            {
              title: 'Factura de proveedor',
              description:
                'Registra la factura electrónica con cálculo automático de ISV, retenciones y generación de cuentas por pagar.',
              icon: ReceiptText,
              actionLabel: 'Capturar factura'
            }
          ]}
          footer="El flujo aplica reglas de aprobación por monto, notificaciones y seguimiento de entregables con indicadores de cumplimiento."
        />
        <div className="space-y-6">
          <DataTable<OrdenCompra>
            title="Órdenes de compra"
            data={data ?? []}
            columns={columns}
          />
          <div className="card p-6 space-y-3">
            <h3 className="text-lg font-semibold text-white">Workflow de compras</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
              <li>Solicitud de compra con validación de presupuesto.</li>
              <li>Orden de compra con aprobación automática por monto.</li>
              <li>Recepción actualiza stock y costo promedio.</li>
              <li>Factura de proveedor genera CxP y retenciones locales (ISV 15%, ISV 18%, exento).</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
