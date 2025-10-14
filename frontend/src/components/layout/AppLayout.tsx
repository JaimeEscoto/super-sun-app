import {
  Bell,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PieChart,
  PlusCircle,
  Search,
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
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Dirección',
    items: [
      { to: '/', label: 'Tablero ejecutivo', icon: LayoutDashboard },
      { to: '/reportes', label: 'Analítica y reportes', icon: PieChart }
    ]
  },
  {
    title: 'Operación',
    items: [
      { to: '/catalogos', label: 'Catálogos maestros', icon: Menu },
      { to: '/inventario', label: 'Inventario y logística', icon: Warehouse },
      { to: '/ventas', label: 'Ventas y CRM', icon: ShoppingBag },
      { to: '/compras', label: 'Compras estratégicas', icon: ShoppingCart },
      { to: '/facturacion', label: 'Facturación electrónica', icon: Package }
    ]
  },
  {
    title: 'Control interno',
    items: [{ to: '/contabilidad', label: 'Contabilidad financiera', icon: Shield }]
  }
];

const quickNavigation = [
  { to: '/', label: 'KPIs' },
  { to: '/catalogos', label: 'Maestros' },
  { to: '/inventario', label: 'Inventario' },
  { to: '/ventas', label: 'Ventas' },
  { to: '/compras', label: 'Compras' },
  { to: '/facturacion', label: 'Facturación' },
  { to: '/contabilidad', label: 'Contabilidad' },
  { to: '/reportes', label: 'Reportes' }
];

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  const menuItems = useMemo(
    () =>
      navigationSections.flatMap((section) =>
        section.items.map((item) => ({
          ...item,
          section: section.title
        }))
      ),
    []
  );

  const activeItem = menuItems.find((item) => item.to === location.pathname);
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'HN';

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
                        {open && <span className="truncate">{item.label}</span>}
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
          <div className="flex flex-col gap-5 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                  {activeItem?.section ?? 'Panel central'}
                </p>
                <h1 className="text-2xl font-semibold text-white md:text-3xl">
                  {activeItem?.label ?? 'Resumen general'}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-slate-800/70 bg-slate-900/70 px-4 py-2 text-sm text-slate-300 shadow-sm shadow-slate-950/20 md:flex">
                  <Search size={16} className="text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar módulo o transacción..."
                    className="w-60 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/20 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/30"
                >
                  <PlusCircle size={16} />
                  <span className="hidden sm:inline">Nuevo registro</span>
                </button>
                <button
                  type="button"
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-800/70 bg-slate-900/70 text-slate-300 transition hover:border-primary/40 hover:text-white"
                  aria-label="Notificaciones"
                >
                  <Bell size={18} />
                  <span className="absolute right-1 top-1 inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </button>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-2">
              {quickNavigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] transition',
                      isActive
                        ? 'border-primary bg-primary/20 text-primary shadow shadow-primary/30'
                        : 'border-slate-800/70 bg-slate-900/60 text-slate-300 hover:border-primary/40 hover:text-white'
                    ].join(' ')
                  }
                >
                  {item.label}
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
