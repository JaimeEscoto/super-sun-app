import { Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { CatalogosPage } from '@/pages/Catalogos';
import { ComprasPage } from '@/pages/Compras';
import { ContabilidadPage } from '@/pages/Contabilidad';
import { DashboardPage } from '@/pages/Dashboard';
import { FacturacionPage } from '@/pages/Facturacion';
import { InventarioPage } from '@/pages/Inventario';
import { LoginPage } from '@/pages/Login';
import { ReportesPage } from '@/pages/Reportes';
import { VentasPage } from '@/pages/Ventas';

export const AppRouter = () => {
  const { isAuthenticated } = useAuth();

  const withLayout = (page: JSX.Element) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }

    return <AppLayout>{page}</AppLayout>;
  };

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={withLayout(<DashboardPage />)}
      />
      <Route
        path="/catalogos"
        element={withLayout(<CatalogosPage />)}
      />
      <Route
        path="/inventario"
        element={withLayout(<InventarioPage />)}
      />
      <Route
        path="/compras"
        element={withLayout(<ComprasPage />)}
      />
      <Route
        path="/ventas"
        element={withLayout(<VentasPage />)}
      />
      <Route
        path="/facturacion"
        element={withLayout(<FacturacionPage />)}
      />
      <Route
        path="/contabilidad"
        element={withLayout(<ContabilidadPage />)}
      />
      <Route
        path="/reportes"
        element={withLayout(<ReportesPage />)}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};
