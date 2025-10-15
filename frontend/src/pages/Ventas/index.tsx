import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ClipboardSignature, FileStack, PackageCheck, Receipt } from 'lucide-react';

import { ActionMenuCard } from '@/components/cards/ActionMenuCard';
import { Column, DataTable } from '@/components/cards/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import api from '@/lib/api';

import { DeliveryCommitmentPlanner } from './DeliveryCommitmentPlanner';
import { PaymentRegistrationForm } from './PaymentRegistrationForm';
import { ProformaInvoiceGenerator } from './ProformaInvoiceGenerator';
import { SalesOrderWizard } from './SalesOrderWizard';

interface Pedido {
  id: string;
  cliente_id: string;
  fecha: string;
  estado: string;
  total: string;
  moneda: string;
}

export const VentasPage = () => {
  const [activeAction, setActiveAction] = useState<'pedido' | 'entrega' | 'proforma' | 'cobro'>('pedido');
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

  const menuItems = useMemo(
    () => [
      {
        title: 'Pedido de venta',
        description:
          'Inicia un nuevo pedido con control de listas de precio, disponibilidad de inventario y políticas de crédito.',
        icon: ClipboardSignature,
        actionLabel: 'Crear pedido',
        helper:
          activeAction === 'pedido' ? (
            <span className="text-emerald-200">Captura activa</span>
          ) : undefined,
        onAction: () => setActiveAction('pedido')
      },
      {
        title: 'Compromiso de entrega',
        description:
          'Programa la salida desde bodega con picking, packing y seguimiento de transporte hasta el cliente final.',
        icon: PackageCheck,
        actionLabel: 'Planificar entrega',
        helper:
          activeAction === 'entrega' ? (
            <span className="text-emerald-200">Programación activa</span>
          ) : undefined,
        onAction: () => setActiveAction('entrega')
      },
      {
        title: 'Factura proforma',
        description:
          'Genera una proforma con desglose de impuestos, descuentos y condiciones negociadas para aprobación del cliente.',
        icon: FileStack,
        actionLabel: 'Emitir proforma',
        helper:
          activeAction === 'proforma' ? (
            <span className="text-emerald-200">Edición activa</span>
          ) : undefined,
        onAction: () => setActiveAction('proforma')
      },
      {
        title: 'Registro de cobro',
        description:
          'Aplica pagos parciales o totales enlazados a la factura y controla los saldos por cobrar por canal de venta.',
        icon: Receipt,
        actionLabel: 'Registrar cobro',
        helper:
          activeAction === 'cobro' ? (
            <span className="text-emerald-200">Aplicación activa</span>
          ) : undefined,
        onAction: () => setActiveAction('cobro')
      }
    ],
    [activeAction]
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ventas y relaciones"
        description="Gestiona pedidos, seguimiento de clientes y cumplimiento comercial con reglas de crédito, listas de precios y promociones regionales."
      />
      <div className="grid gap-6 lg:grid-cols-[320px,1fr] xl:grid-cols-[360px,1fr]">
        <ActionMenuCard
          title="Menú comercial"
          description="Selecciona el trámite comercial y continúa con la captura guiada sin perder contexto del cliente."
          items={menuItems}
          footer="Los flujos comerciales sincronizan el estado del pedido con inventarios, facturación electrónica y cartera de clientes."
        />
        <div className="space-y-6">
          <div className="space-y-6">
            {activeAction === 'pedido' ? <SalesOrderWizard /> : null}
            {activeAction === 'entrega' ? <DeliveryCommitmentPlanner /> : null}
            {activeAction === 'proforma' ? <ProformaInvoiceGenerator /> : null}
            {activeAction === 'cobro' ? <PaymentRegistrationForm /> : null}
          </div>
          <DataTable<Pedido> title="Pedidos de venta" data={data ?? []} columns={columns} />
          <div className="card p-6 space-y-3">
            <h3 className="text-lg font-semibold text-white">Política comercial</h3>
            <p className="text-sm text-slate-300">
              Se valida el límite de crédito, listas de precios segmentadas, descuentos por volumen y promociones aplicables según canal de venta, considerando reglas de ISV y exoneraciones hondureñas. Integra reservas de inventario y picking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
