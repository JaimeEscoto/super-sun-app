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
    <div className="min-h-screen flex text-slate-100">
      <aside
        className={`relative hidden shrink-0 border-r border-white/10 bg-white/5 backdrop-blur-2xl transition-all duration-300 lg:flex ${
          open ? 'w-80' : 'w-24'
        }`}
      >
        <div className="flex h-full w-full flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
            <Link to="/" className="flex items-center gap-3 text-white">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold text-primary">
                HN
              </span>
              {open && (
                <div className="space-y-0.5">
                  <p className="text-xs uppercase tracking-[0.45em] text-white/60">ERP Manufactura</p>
                  <p className="text-lg font-semibold">Solaris HN</p>
                </div>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:border-primary/60 hover:text-white"
            >
              <Menu size={18} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            {navigationSections.map((section) => (
              <div key={section.title} className="mb-7 last:mb-0">
                {open && (
                  <p className="px-3 text-xs font-semibold uppercase tracking-[0.35em] text-white/50">{section.title}</p>
                )}
                <div className="mt-3 flex flex-col gap-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          [
                            'group flex items-center rounded-2xl px-3 py-2 text-sm font-medium text-white/70 transition backdrop-blur',
                            open ? 'gap-4 justify-start' : 'gap-0 justify-center',
                            isActive
                              ? 'bg-primary/20 text-white shadow-[0_20px_35px_-25px_rgba(59,130,246,0.7)]'
                              : 'hover:bg-white/10 hover:text-white'
                          ].join(' ')
                        }
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-primary transition group-hover:border-primary/50 group-hover:text-primary">
                          <Icon size={18} />
                        </span>
                        {open && (
                          <span className="flex flex-col truncate">
                            <span className="truncate text-sm font-semibold text-white">{item.label}</span>
                            <span className="text-xs font-normal text-white/60">{item.description}</span>
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 px-4 py-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/20 text-base font-semibold text-primary">
                  {initials}
                </span>
                {open && (
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{user ? user.email : 'Invitado'}</p>
                    {user && (
                      <p className="text-xs uppercase tracking-[0.35em] text-white/50">{user.role}</p>
                    )}
                  </div>
                )}
                {user && (
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-primary/60 hover:text-white"
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
        <header className="border-b border-white/10 bg-white/5 px-4 py-6 text-slate-100 backdrop-blur-2xl sm:px-8">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">
                  {activeItem?.section ?? 'Panel central'}
                </p>
                <h1 className="text-3xl font-semibold text-white md:text-4xl">
                  {activeItem?.label ?? 'Resumen general'}
                </h1>
                <p className="max-w-3xl text-sm leading-relaxed text-white/70">
                  {activeItem?.description ?? defaultDescription}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-xs text-white/70 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.9)] lg:max-w-sm">
                <p className="text-sm font-semibold text-white">Atajo administrativo</p>
                <p className="mt-2 leading-relaxed">
                  Usa el menú contextual para ir directo al módulo que necesites y mantén tu foco en una sola transacción por pantalla.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
              {menuItems.map((item) => (
                <span
                  key={item.to}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 transition ${
                    item.to === activeItem?.to
                      ? 'border-primary/60 bg-primary/20 text-white'
                      : 'border-white/10 bg-white/5'
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
            <div className="mx-auto flex max-w-6xl flex-col gap-10 pb-16">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};
