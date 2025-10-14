import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Column } from '@/components/cards/DataTable';
import {
  MaintenanceField,
  MaintenanceSection
} from '@/components/catalogs/MaintenanceSection';
import api from '@/lib/api';

const currencyFormatter = new Intl.NumberFormat('es-HN', {
  style: 'currency',
  currency: 'HNL'
});

const numberFormatter = new Intl.NumberFormat('es-HN');

type ClientRow = {
  id: string;
  codigo: string;
  razonSocial: string;
  nif: string;
  limiteCredito: number;
  saldo: number;
  estado: string;
};

type ClientFormValues = {
  codigo: string;
  razonSocial: string;
  nif: string;
  limiteCredito: string;
  saldo: string;
  estado: string;
};

type SupplierRow = {
  id: string;
  nombre: string;
  nif: string;
  saldo: number;
};

type SupplierFormValues = {
  nombre: string;
  nif: string;
  saldo: string;
};

type ProductRow = {
  id: string;
  sku: string;
  descripcion: string;
  uom: string;
  precioBase: number;
  activo: boolean;
};

type ProductFormValues = {
  sku: string;
  descripcion: string;
  uom: string;
  precioBase: string;
  activo: string;
};

type WarehouseRow = {
  id: string;
  codigo: string;
  nombre: string;
};

type WarehouseFormValues = {
  codigo: string;
  nombre: string;
};

type PaymentTermRow = {
  id: string;
  nombre: string;
  dias: number;
};

type PaymentTermFormValues = {
  nombre: string;
  dias: string;
};

type PriceListRow = {
  id: string;
  nombre: string;
  moneda: string;
  activa: boolean;
};

type PriceListFormValues = {
  nombre: string;
  moneda: string;
  activa: string;
};

type TaxTypeRow = {
  id: string;
  nombre: string;
  tasa: number;
  tipo: string;
  aplicacion: string;
};

type TaxTypeFormValues = {
  nombre: string;
  tasa: string;
  tipo: string;
  aplicacion: string;
};

type LocationRow = {
  id: string;
  almacenId: string;
  almacenNombre: string;
  codigo: string;
  descripcion: string | null;
};

type LocationFormValues = {
  almacenId: string;
  codigo: string;
  descripcion: string;
};

const clientColumns: Column<ClientRow>[] = [
  { header: 'Código', accessor: 'codigo' },
  { header: 'Razón social', accessor: 'razonSocial' },
  { header: 'RTN', accessor: 'nif' },
  {
    header: 'Límite crédito',
    accessor: 'limiteCredito',
    render: (value) => currencyFormatter.format(Number(value))
  },
  {
    header: 'Saldo',
    accessor: 'saldo',
    render: (value) => currencyFormatter.format(Number(value))
  },
  { header: 'Estado', accessor: 'estado' }
];

const clientFields: MaintenanceField<ClientFormValues>[] = [
  { name: 'codigo', label: 'Código', type: 'text', required: true },
  { name: 'razonSocial', label: 'Razón social', type: 'text', required: true },
  { name: 'nif', label: 'RTN', type: 'text', required: true },
  { name: 'limiteCredito', label: 'Límite de crédito (HNL)', type: 'number', step: '0.01' },
  { name: 'saldo', label: 'Saldo actual (HNL)', type: 'number', step: '0.01' },
  {
    name: 'estado',
    label: 'Estado',
    type: 'select',
    required: true,
    options: [
      { value: 'ACTIVO', label: 'Activo' },
      { value: 'INACTIVO', label: 'Inactivo' }
    ]
  }
];

const clientInitialValues: ClientFormValues = {
  codigo: '',
  razonSocial: '',
  nif: '',
  limiteCredito: '',
  saldo: '',
  estado: 'ACTIVO'
};

const supplierColumns: Column<SupplierRow>[] = [
  { header: 'Nombre', accessor: 'nombre' },
  { header: 'RTN', accessor: 'nif' },
  {
    header: 'Saldo',
    accessor: 'saldo',
    render: (value) => currencyFormatter.format(Number(value))
  }
];

const supplierFields: MaintenanceField<SupplierFormValues>[] = [
  { name: 'nombre', label: 'Nombre', type: 'text', required: true },
  { name: 'nif', label: 'RTN', type: 'text', required: true },
  { name: 'saldo', label: 'Saldo (HNL)', type: 'number', step: '0.01' }
];

const supplierInitialValues: SupplierFormValues = {
  nombre: '',
  nif: '',
  saldo: ''
};

const productColumns: Column<ProductRow>[] = [
  { header: 'SKU', accessor: 'sku' },
  { header: 'Descripción', accessor: 'descripcion' },
  { header: 'Unidad', accessor: 'uom' },
  {
    header: 'Precio base',
    accessor: 'precioBase',
    render: (value) => currencyFormatter.format(Number(value))
  },
  {
    header: 'Estado',
    accessor: 'activo',
    render: (value) => (value ? 'Activo' : 'Inactivo')
  }
];

const productFields: MaintenanceField<ProductFormValues>[] = [
  { name: 'sku', label: 'SKU', type: 'text', required: true },
  { name: 'descripcion', label: 'Descripción', type: 'text', required: true },
  { name: 'uom', label: 'Unidad de medida', type: 'text', required: true },
  { name: 'precioBase', label: 'Precio base (HNL)', type: 'number', step: '0.01' },
  {
    name: 'activo',
    label: 'Estado',
    type: 'select',
    required: true,
    options: [
      { value: 'true', label: 'Activo' },
      { value: 'false', label: 'Inactivo' }
    ]
  }
];

const productInitialValues: ProductFormValues = {
  sku: '',
  descripcion: '',
  uom: '',
  precioBase: '',
  activo: 'true'
};

const warehouseColumns: Column<WarehouseRow>[] = [
  { header: 'Código', accessor: 'codigo' },
  { header: 'Nombre', accessor: 'nombre' }
];

const warehouseFields: MaintenanceField<WarehouseFormValues>[] = [
  { name: 'codigo', label: 'Código', type: 'text', required: true },
  { name: 'nombre', label: 'Nombre', type: 'text', required: true }
];

const warehouseInitialValues: WarehouseFormValues = {
  codigo: '',
  nombre: ''
};

const paymentTermColumns: Column<PaymentTermRow>[] = [
  { header: 'Nombre', accessor: 'nombre' },
  {
    header: 'Días',
    accessor: 'dias',
    render: (value) => numberFormatter.format(Number(value))
  }
];

const paymentTermFields: MaintenanceField<PaymentTermFormValues>[] = [
  { name: 'nombre', label: 'Nombre', type: 'text', required: true },
  { name: 'dias', label: 'Días', type: 'number', step: '1', required: true }
];

const paymentTermInitialValues: PaymentTermFormValues = {
  nombre: '',
  dias: ''
};

const priceListColumns: Column<PriceListRow>[] = [
  { header: 'Nombre', accessor: 'nombre' },
  { header: 'Moneda', accessor: 'moneda' },
  {
    header: 'Estado',
    accessor: 'activa',
    render: (value) => (value ? 'Activa' : 'Inactiva')
  }
];

const priceListFields: MaintenanceField<PriceListFormValues>[] = [
  { name: 'nombre', label: 'Nombre', type: 'text', required: true },
  { name: 'moneda', label: 'Moneda', type: 'text', required: true },
  {
    name: 'activa',
    label: 'Estado',
    type: 'select',
    required: true,
    options: [
      { value: 'true', label: 'Activa' },
      { value: 'false', label: 'Inactiva' }
    ]
  }
];

const priceListInitialValues: PriceListFormValues = {
  nombre: '',
  moneda: 'HNL',
  activa: 'true'
};

const taxTypeColumns: Column<TaxTypeRow>[] = [
  { header: 'Nombre', accessor: 'nombre' },
  {
    header: 'Tasa %',
    accessor: 'tasa',
    render: (value) => numberFormatter.format(Number(value))
  },
  { header: 'Tipo', accessor: 'tipo' },
  { header: 'Aplicación', accessor: 'aplicacion' }
];

const taxTypeFields: MaintenanceField<TaxTypeFormValues>[] = [
  { name: 'nombre', label: 'Nombre', type: 'text', required: true },
  { name: 'tasa', label: 'Tasa (%)', type: 'number', step: '0.01', required: true },
  {
    name: 'tipo',
    label: 'Tipo',
    type: 'select',
    required: true,
    options: [
      { value: 'ISV', label: 'ISV' },
      { value: 'ISC', label: 'ISC' },
      { value: 'RETENCION', label: 'Retención' },
      { value: 'EXENTO', label: 'Exento' }
    ]
  },
  {
    name: 'aplicacion',
    label: 'Aplicación',
    type: 'select',
    required: true,
    options: [
      { value: 'VENTA', label: 'Venta' },
      { value: 'COMPRA', label: 'Compra' },
      { value: 'AMBOS', label: 'Ambos' }
    ]
  }
];

const taxTypeInitialValues: TaxTypeFormValues = {
  nombre: '',
  tasa: '',
  tipo: 'ISV',
  aplicacion: 'VENTA'
};

const locationColumns: Column<LocationRow>[] = [
  { header: 'Almacén', accessor: 'almacenNombre' },
  { header: 'Código', accessor: 'codigo' },
  { header: 'Descripción', accessor: 'descripcion', render: (value) => value ?? '-' }
];

export const CatalogosPage = () => {
  const [activeTab, setActiveTab] = useState('clientes');

  const { data: warehouseOptionsData } = useQuery({
    queryKey: ['catalogos', 'almacenes', 'options'],
    queryFn: async () => {
      const response = await api.get<{ data: WarehouseRow[] }>('/catalogos/almacenes');
      return response.data.data;
    }
  });

  const warehouseOptions = useMemo(
    () =>
      (warehouseOptionsData ?? []).map((warehouse) => ({
        value: warehouse.id,
        label: `${warehouse.codigo} · ${warehouse.nombre}`
      })),
    [warehouseOptionsData]
  );

  const locationFields: MaintenanceField<LocationFormValues>[] = [
    {
      name: 'almacenId',
      label: 'Almacén',
      type: 'select',
      required: true,
      options: warehouseOptions
    },
    { name: 'codigo', label: 'Código', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'text' }
  ];

  const locationInitialValues: LocationFormValues = {
    almacenId: '',
    codigo: '',
    descripcion: ''
  };

  const tabs = useMemo(
    () => [
      {
        id: 'clientes',
        label: 'Clientes',
        component: (
          <MaintenanceSection<ClientFormValues, ClientRow>
            title="Clientes"
            endpoint="clientes"
            queryKey={['catalogos', 'clientes']}
            columns={clientColumns}
            fields={clientFields}
            initialValues={clientInitialValues}
            mapRowToForm={(row) => ({
              codigo: row.codigo,
              razonSocial: row.razonSocial,
              nif: row.nif,
              limiteCredito: row.limiteCredito ? String(row.limiteCredito) : '',
              saldo: row.saldo ? String(row.saldo) : '',
              estado: row.estado
            })}
            mapFormToPayload={(values) => ({
              codigo: values.codigo.trim(),
              razonSocial: values.razonSocial.trim(),
              nif: values.nif.trim(),
              limiteCredito: values.limiteCredito ? Number(values.limiteCredito) : 0,
              saldo: values.saldo ? Number(values.saldo) : 0,
              estado: values.estado
            })}
            successMessage="Cliente registrado correctamente"
            description="Gestiona clientes con límites de crédito, RTN y estado comercial."
          />
        )
      },
      {
        id: 'proveedores',
        label: 'Proveedores',
        component: (
          <MaintenanceSection<SupplierFormValues, SupplierRow>
            title="Proveedores"
            endpoint="proveedores"
            queryKey={['catalogos', 'proveedores']}
            columns={supplierColumns}
            fields={supplierFields}
            initialValues={supplierInitialValues}
            mapRowToForm={(row) => ({
              nombre: row.nombre,
              nif: row.nif,
              saldo: row.saldo ? String(row.saldo) : ''
            })}
            mapFormToPayload={(values) => ({
              nombre: values.nombre.trim(),
              nif: values.nif.trim(),
              saldo: values.saldo ? Number(values.saldo) : 0
            })}
            successMessage="Proveedor registrado correctamente"
            description="Da de alta proveedores con su RTN y saldo inicial de cuentas por pagar."
          />
        )
      },
      {
        id: 'productos',
        label: 'Productos',
        component: (
          <MaintenanceSection<ProductFormValues, ProductRow>
            title="Productos"
            endpoint="productos"
            queryKey={['catalogos', 'productos']}
            columns={productColumns}
            fields={productFields}
            initialValues={productInitialValues}
            mapRowToForm={(row) => ({
              sku: row.sku,
              descripcion: row.descripcion,
              uom: row.uom,
              precioBase: row.precioBase ? String(row.precioBase) : '',
              activo: row.activo ? 'true' : 'false'
            })}
            mapFormToPayload={(values) => ({
              sku: values.sku.trim(),
              descripcion: values.descripcion.trim(),
              uom: values.uom.trim(),
              precioBase: values.precioBase ? Number(values.precioBase) : 0,
              activo: values.activo === 'true'
            })}
            successMessage="Producto registrado correctamente"
            description="Administra tu catálogo de productos con precios base y estado activo."
          />
        )
      },
      {
        id: 'almacenes',
        label: 'Almacenes',
        component: (
          <MaintenanceSection<WarehouseFormValues, WarehouseRow>
            title="Almacenes"
            endpoint="almacenes"
            queryKey={['catalogos', 'almacenes']}
            columns={warehouseColumns}
            fields={warehouseFields}
            initialValues={warehouseInitialValues}
            mapRowToForm={(row) => ({
              codigo: row.codigo,
              nombre: row.nombre
            })}
            mapFormToPayload={(values) => ({
              codigo: values.codigo.trim(),
              nombre: values.nombre.trim()
            })}
            successMessage="Almacén registrado correctamente"
            description="Define los almacenes físicos o virtuales que gestionarán inventario."
          />
        )
      },
      {
        id: 'condiciones-pago',
        label: 'Condiciones de pago',
        component: (
          <MaintenanceSection<PaymentTermFormValues, PaymentTermRow>
            title="Condiciones de pago"
            endpoint="condiciones-pago"
            queryKey={['catalogos', 'condiciones-pago']}
            columns={paymentTermColumns}
            fields={paymentTermFields}
            initialValues={paymentTermInitialValues}
            mapRowToForm={(row) => ({
              nombre: row.nombre,
              dias: row.dias ? String(row.dias) : ''
            })}
            mapFormToPayload={(values) => ({
              nombre: values.nombre.trim(),
              dias: Number(values.dias || 0)
            })}
            successMessage="Condición de pago registrada"
            description="Configura plazos de crédito que podrán asignarse a clientes y proveedores."
          />
        )
      },
      {
        id: 'listas-precio',
        label: 'Listas de precio',
        component: (
          <MaintenanceSection<PriceListFormValues, PriceListRow>
            title="Listas de precio"
            endpoint="listas-precio"
            queryKey={['catalogos', 'listas-precio']}
            columns={priceListColumns}
            fields={priceListFields}
            initialValues={priceListInitialValues}
            mapRowToForm={(row) => ({
              nombre: row.nombre,
              moneda: row.moneda,
              activa: row.activa ? 'true' : 'false'
            })}
            mapFormToPayload={(values) => ({
              nombre: values.nombre.trim(),
              moneda: values.moneda.trim().toUpperCase(),
              activa: values.activa === 'true'
            })}
            successMessage="Lista de precio registrada"
            description="Mantén múltiples listas de precio por moneda o segmento."
          />
        )
      },
      {
        id: 'tipos-impuesto',
        label: 'Tipos de impuesto',
        component: (
          <MaintenanceSection<TaxTypeFormValues, TaxTypeRow>
            title="Tipos de impuesto"
            endpoint="tipos-impuesto"
            queryKey={['catalogos', 'tipos-impuesto']}
            columns={taxTypeColumns}
            fields={taxTypeFields}
            initialValues={taxTypeInitialValues}
            mapRowToForm={(row) => ({
              nombre: row.nombre,
              tasa: row.tasa ? String(row.tasa) : '',
              tipo: row.tipo,
              aplicacion: row.aplicacion
            })}
            mapFormToPayload={(values) => ({
              nombre: values.nombre.trim(),
              tasa: Number(values.tasa || 0),
              tipo: values.tipo,
              aplicacion: values.aplicacion
            })}
            successMessage="Tipo de impuesto registrado"
            description="Define tasas ISV, retenciones u otros impuestos aplicables."
          />
        )
      },
      {
        id: 'ubicaciones',
        label: 'Ubicaciones',
        component: (
          <MaintenanceSection<LocationFormValues, LocationRow>
            title="Ubicaciones"
            endpoint="ubicaciones"
            queryKey={['catalogos', 'ubicaciones']}
            columns={locationColumns}
            fields={locationFields}
            initialValues={locationInitialValues}
            mapRowToForm={(row) => ({
              almacenId: row.almacenId,
              codigo: row.codigo,
              descripcion: row.descripcion ?? ''
            })}
            mapFormToPayload={(values) => ({
              almacenId: values.almacenId,
              codigo: values.codigo.trim(),
              descripcion: values.descripcion.trim() || null
            })}
            successMessage="Ubicación registrada"
            description="Crea ubicaciones específicas dentro de cada almacén."
          />
        )
      }
    ],
    [warehouseOptions]
  );

  const activeComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeComponent}
    </div>
  );
};
