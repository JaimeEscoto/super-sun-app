import {
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PieChart,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Warehouse
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ReactNode, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavigationItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Dirección',
    items: [
      {
        to: '/',
        label: 'Tablero ejecutivo',
        icon: LayoutDashboard,
        description: 'Monitorea KPIs corporativos, flujo de efectivo y alertas presupuestarias.'
      },
      {
        to: '/reportes',
        label: 'Analítica y reportes',
        icon: PieChart,
        description: 'Construye reportes financieros, de ventas y compras con filtros dinámicos.'
      }
    ]
  },
  {
    title: 'Operación',
    items: [
      {
        to: '/catalogos',
        label: 'Catálogos maestros',
        icon: Menu,
        description: 'Administra proveedores, productos, listas de precios y unidades de medida.'
      },
      {
        to: '/inventario',
        label: 'Inventario y logística',
        icon: Warehouse,
        description: 'Controla existencias, recepciones, transferencias y costos promedio por almacén.'
      },
      {
        to: '/ventas',
        label: 'Ventas y CRM',
        icon: ShoppingBag,
        description: 'Gestiona oportunidades, cotizaciones y pedidos con seguimiento comercial.'
      },
      {
        to: '/compras',
        label: 'Compras estratégicas',
        icon: ShoppingCart,
        description: 'Crea requisiciones, órdenes y recepciones con flujos de aprobación automáticos.'
      },
      {
        to: '/facturacion',
        label: 'Facturación electrónica',
        icon: Package,
        description: 'Emite facturas SAR, notas de crédito y retenciones con validaciones fiscales.'
      }
    ]
  },
  {
    title: 'Control interno',
    items: [
      {
        to: '/contabilidad',
        label: 'Contabilidad financiera',
        icon: Shield,
        description: 'Integra pólizas, conciliaciones y cierres con auditoría completa.'
      }
    ]
  }
];

type NavigationItemWithSection = NavigationItem & { section: string };

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(true);
  const location = useLocation();

  const menuItems = useMemo(
    () =>
      navigationSections.flatMap<NavigationItemWithSection>((section) =>
        section.items.map((item) => ({
          ...item,
          section: section.title
        }))
      ),
    []
  );

  const activeItem = menuItems.find((item) => item.to === location.pathname);
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'HN';

  const defaultDescription =
    'Selecciona un módulo para navegar por los procesos clave del ERP y utiliza los accesos directos para cambiar de área de trabajo rápidamente.';

  return (
    <div className="min-h-screen flex text-slate-100">
      <aside
        className={`relative hidden shrink-0 border-r border-slate-800/70 bg-slate-950/80 backdrop-blur-xl transition-all duration-300 lg:flex ${
          open ? 'w-72' : 'w-24'
        }`}
      >
        <div className="flex h-full w-full flex-col">
          <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/70">
            <Link to="/" className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 text-lg font-bold text-primary">
                HN
              </span>
              {open && (
                <div className="space-y-0.5">
                  <p className="text-xs uppercase tracking-[0.45em] text-slate-400">ERP Manufactura</p>
                  <p className="text-lg font-semibold text-white">Solaris HN</p>
                </div>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-800/70 bg-slate-900/70 text-slate-400 transition hover:text-white"
            >
              <Menu size={18} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            {navigationSections.map((section) => (
              <div key={section.title} className="mb-7 last:mb-0">
                {open && (
                  <p className="px-3 text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{section.title}</p>
                )}
                <div className="mt-3 flex flex-col gap-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                          [
                            'group flex items-center rounded-xl px-3 py-2 text-sm font-medium transition',
                            open ? 'gap-3 justify-start' : 'gap-0 justify-center',
                            isActive
                              ? 'bg-primary/20 text-white shadow shadow-primary/30'
                              : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                          ].join(' ')
                        }
                      >
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800/60 bg-slate-900/60 text-primary transition group-hover:border-primary/40 group-hover:text-primary"
                        >
                          <Icon size={18} />
                        </span>
                        {open && (
                          <span className="flex flex-col truncate">
                            <span className="truncate text-sm font-medium">{item.label}</span>
                            <span className="text-xs font-normal text-slate-400">{item.description}</span>
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-auto border-t border-slate-800/70 px-4 py-6">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/30">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20 text-base font-semibold text-primary">
                  {initials}
                </span>
                {open && (
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{user ? user.email : 'Invitado'}</p>
                    {user && (
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{user.role}</p>
                    )}
                  </div>
                )}
                {user && (
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-800/70 bg-slate-900/70 text-slate-300 transition hover:border-primary/40 hover:text-primary"
                    aria-label="Cerrar sesión"
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
          <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                  {activeItem?.section ?? 'Panel central'}
                </p>
                <h1 className="text-2xl font-semibold text-white md:text-3xl">
                  {activeItem?.label ?? 'Resumen general'}
                </h1>
                <p className="max-w-3xl text-sm text-slate-300">
                  {activeItem?.description ?? defaultDescription}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 text-xs text-slate-300 shadow-inner shadow-slate-950/40 lg:max-w-sm">
                <p className="font-semibold text-white">Consejo de navegación</p>
                <p className="mt-1 leading-relaxed">
                  Explora cada módulo desde el menú lateral o selecciona un acceso directo a continuación para ir directo al proceso que necesitas.
                </p>
              </div>
            </div>

            <nav className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {menuItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'group flex items-start gap-3 rounded-2xl border px-4 py-4 transition',
                      isActive
                        ? 'border-primary/70 bg-primary/15 shadow-lg shadow-primary/20'
                        : 'border-slate-800/70 bg-slate-900/60 hover:border-primary/50 hover:bg-slate-900'
                    ].join(' ')
                  }
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800/60 bg-slate-900 text-primary transition group-hover:border-primary/40 group-hover:text-primary">
                    <item.icon size={18} />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <p className="text-xs text-slate-300">{item.description}</p>
                  </div>
                </NavLink>
              ))}
            </nav>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.08),transparent_60%)]" />
          <div className="relative px-4 py-8 sm:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-10 pb-16">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};
