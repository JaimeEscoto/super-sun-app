import { useQuery } from '@tanstack/react-query';
import { ClipboardSignature, FileStack, PackageCheck, Receipt } from 'lucide-react';

import { ActionMenuCard } from '@/components/cards/ActionMenuCard';
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
        description="Gestiona pedidos, seguimiento de clientes y cumplimiento comercial con reglas de crédito, listas de precios y promociones regionales."
      />
      <div className="grid gap-6 lg:grid-cols-[320px,1fr] xl:grid-cols-[360px,1fr]">
        <ActionMenuCard
          title="Menú comercial"
          description="Selecciona el trámite comercial y continúa con la captura guiada sin perder contexto del cliente."
          items={[
            {
              title: 'Pedido de venta',
              description:
                'Inicia un nuevo pedido con control de listas de precio, disponibilidad de inventario y políticas de crédito.',
              icon: ClipboardSignature,
              actionLabel: 'Crear pedido'
            },
            {
              title: 'Compromiso de entrega',
              description:
                'Programa la salida desde bodega con picking, packing y seguimiento de transporte hasta el cliente final.',
              icon: PackageCheck,
              actionLabel: 'Planificar entrega'
            },
            {
              title: 'Factura proforma',
              description:
                'Genera una proforma con desglose de impuestos, descuentos y condiciones negociadas para aprobación del cliente.',
              icon: FileStack,
              actionLabel: 'Emitir proforma'
            },
            {
              title: 'Registro de cobro',
              description:
                'Aplica pagos parciales o totales enlazados a la factura y controla los saldos por cobrar por canal de venta.',
              icon: Receipt,
              actionLabel: 'Registrar cobro'
            }
          ]}
          footer="Los flujos comerciales sincronizan el estado del pedido con inventarios, facturación electrónica y cartera de clientes."
        />
        <div className="space-y-6">
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
