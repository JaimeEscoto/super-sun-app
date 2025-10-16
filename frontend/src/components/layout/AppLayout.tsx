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
    'Selecciona un módulo desde el menú lateral para navegar por los procesos clave del ERP y mantener el flujo operativo controlado.';

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      <aside
        className={`relative hidden shrink-0 border-r border-slate-800 bg-secondary transition-all duration-300 lg:flex ${
          open ? 'w-72' : 'w-24'
        }`}
      >
        <div className="flex h-full w-full flex-col text-slate-200">
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-5">
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-secondary text-slate-300 transition hover:border-primary/50 hover:text-primary"
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
                              ? 'bg-primary/20 text-white shadow-inner shadow-primary/30'
                              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                          ].join(' ')
                        }
                      >
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-primary transition group-hover:border-primary/50 group-hover:text-primary"
                        >
                          <Icon size={18} />
                        </span>
                        {open && (
                          <span className="flex flex-col truncate">
                            <span className="truncate text-sm font-medium text-slate-100">{item.label}</span>
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

          <div className="mt-auto border-t border-slate-800 px-4 py-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20 text-base font-semibold text-primary">
                  {initials}
                </span>
                {open && (
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{user ? user.email : 'Invitado'}</p>
                    {user && (
                      <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{user.role}</p>
                    )}
                  </div>
                )}
                {user && (
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-secondary text-slate-300 transition hover:border-primary/50 hover:text-primary"
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
        <header className="border-b border-slate-800 bg-secondary text-slate-100 shadow-lg">
          <div className="flex flex-col gap-6 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                  {activeItem?.section ?? 'Panel central'}
                </p>
                <h1 className="text-2xl font-semibold text-white md:text-3xl">
                  {activeItem?.label ?? 'Resumen general'}
                </h1>
                <p className="max-w-3xl text-sm text-slate-300">
                  {activeItem?.description ?? defaultDescription}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-xs text-slate-300 shadow-inner lg:max-w-sm">
                <p className="font-semibold text-white">Atajo administrativo</p>
                <p className="mt-1 leading-relaxed">
                  Usa el panel lateral para moverte entre módulos y mantener a la vista las transacciones prioritarias de SAP Business One.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              {menuItems.map((item) => (
                <span
                  key={item.to}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 transition ${
                    item.to === activeItem?.to
                      ? 'border-primary/60 bg-primary/20 text-white'
                      : 'border-slate-700 bg-slate-900/40'
                  }`}
                >
                  <item.icon size={14} />
                  <span className="text-[11px] font-medium uppercase tracking-[0.25em]">{item.label}</span>
                </span>
              ))}
            </div>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto">
          <div className="relative px-4 py-8 sm:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-10 pb-16">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};
