import { Menu, Package, PieChart, Shield, ShoppingBag, ShoppingCart, Warehouse } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

interface AppLayoutProps {
  children: ReactNode;
}

const navigation = [
  { to: '/', label: 'Dashboard', icon: PieChart },
  { to: '/catalogos', label: 'Catálogos', icon: Menu },
  { to: '/inventario', label: 'Inventario', icon: Warehouse },
  { to: '/compras', label: 'Compras', icon: ShoppingCart },
  { to: '/ventas', label: 'Ventas', icon: ShoppingBag },
  { to: '/facturacion', label: 'Facturación', icon: Package },
  { to: '/contabilidad', label: 'Contabilidad', icon: Shield },
  { to: '/reportes', label: 'Reportes', icon: PieChart }
];

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen flex">
      <aside className={`bg-slate-900/80 backdrop-blur-sm border-r border-slate-800 ${open ? 'w-72' : 'w-20'} transition-all duration-300`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold">
              MX
            </span>
            {open && (
              <div>
                <p className="text-sm uppercase tracking-widest text-slate-400">ERP Manufactura</p>
                <p className="text-lg font-semibold text-white">Solaris MX</p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="text-slate-400 hover:text-white"
          >
            <Menu size={20} />
          </button>
        </div>
        <nav className="px-4 py-6 flex flex-col gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-primary/20 text-primary' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {open && item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-sm">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-400">Bienvenido</p>
              <p className="text-lg font-semibold text-white">
                {user ? user.email : 'Invitado'}
              </p>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold uppercase text-primary">
                  {user.role}
                </span>
                <button
                  type="button"
                  className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:bg-slate-800"
                  onClick={logout}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 px-8 py-6 bg-slate-950/80">{children}</main>
      </div>
    </div>
  );
};
