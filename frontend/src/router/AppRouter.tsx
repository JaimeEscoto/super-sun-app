import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/components/layout/AppLayout';
import { CatalogosPage } from '@/pages/Catalogos';
import { ComprasPage } from '@/pages/Compras';
import { ContabilidadPage } from '@/pages/Contabilidad';
import { DashboardPage } from '@/pages/Dashboard';
import { FacturacionPage } from '@/pages/Facturacion';
import { InventarioPage } from '@/pages/Inventario';
import { ReportesPage } from '@/pages/Reportes';
import { VentasPage } from '@/pages/Ventas';

export const AppRouter = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        }
      />
      <Route
        path="/catalogos"
        element={
          <AppLayout>
            <CatalogosPage />
          </AppLayout>
        }
      />
      <Route
        path="/inventario"
        element={
          <AppLayout>
            <InventarioPage />
          </AppLayout>
        }
      />
      <Route
        path="/compras"
        element={
          <AppLayout>
            <ComprasPage />
          </AppLayout>
        }
      />
      <Route
        path="/ventas"
        element={
          <AppLayout>
            <VentasPage />
          </AppLayout>
        }
      />
      <Route
        path="/facturacion"
        element={
          <AppLayout>
            <FacturacionPage />
          </AppLayout>
        }
      />
      <Route
        path="/contabilidad"
        element={
          <AppLayout>
            <ContabilidadPage />
          </AppLayout>
        }
      />
      <Route
        path="/reportes"
        element={
          <AppLayout>
            <ReportesPage />
          </AppLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
