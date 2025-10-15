import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export interface ActionMenuItem {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  helper?: ReactNode;
  onAction?: () => void;
}

interface ActionMenuCardProps {
  title: string;
  description: string;
  items: ActionMenuItem[];
  footer?: ReactNode;
}

export const ActionMenuCard = ({ title, description, items, footer }: ActionMenuCardProps) => {
  return (
    <div className="card p-6 space-y-6">
      <header className="space-y-2">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-slate-300">{description}</p>
      </header>
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-emerald-500/50 hover:bg-slate-900"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-400">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                <p className="text-xs text-slate-300">{item.description}</p>
                {item.helper ? <div className="text-xs text-slate-400">{item.helper}</div> : null}
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={item.onAction}
                className="inline-flex items-center rounded-md bg-emerald-500 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
              >
                {item.actionLabel ?? 'Iniciar'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {footer ? <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">{footer}</div> : null}
    </div>
  );
};
