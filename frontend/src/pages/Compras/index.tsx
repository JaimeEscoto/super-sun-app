import { useQuery } from '@tanstack/react-query';
import { ClipboardList, FileSpreadsheet, ReceiptText, Truck } from 'lucide-react';

import { ActionMenuCard } from '@/components/cards/ActionMenuCard';
import { Column, DataTable } from '@/components/cards/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import api from '@/lib/api';

import { PurchaseOrderForm } from './PurchaseOrderForm';

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
      <div className="grid gap-6 xl:grid-cols-[1.7fr,1fr]">
        <div className="space-y-6">
          <PurchaseOrderForm />
          <div className="card space-y-4 p-6">
            <h3 className="text-lg font-semibold text-white">Buenas prácticas de abastecimiento</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                <h4 className="text-sm font-semibold text-emerald-200">Planeación colaborativa</h4>
                <p className="mt-2 text-xs text-emerald-100">
                  Comparte la orden con producción y almacén para confirmar capacidades antes del envío al proveedor.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800/70 bg-slate-900/70 p-4">
                <h4 className="text-sm font-semibold text-white">Seguimiento de entregas</h4>
                <p className="mt-2 text-xs text-slate-300">
                  Define hitos de recepción y utiliza indicadores de puntualidad para activar alertas automáticas.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <ActionMenuCard
            title="Menú de abastecimiento"
            description="Selecciona el proceso que necesitas y continúa el flujo en el panel principal."
            items={[
              {
                title: 'Requisición interna',
                description:
                  'Captura necesidades por centro de costo y envíalas a aprobación con control presupuestal.',
                icon: ClipboardList,
                actionLabel: 'Iniciar requisición'
              },
              {
                title: 'Orden de compra',
                description:
                  'Completa el formulario a la izquierda, valida totales y envía a aprobación automática por monto.',
                icon: FileSpreadsheet,
                actionLabel: 'Gestionar orden',
                helper: <span className="text-emerald-200">Usa el formulario mejorado para registrar partidas y condiciones.</span>
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
          <DataTable<OrdenCompra>
            title="Órdenes de compra recientes"
            data={data ?? []}
            columns={columns}
          />
          <div className="card space-y-3 p-6">
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
