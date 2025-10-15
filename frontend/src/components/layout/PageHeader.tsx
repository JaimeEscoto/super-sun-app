import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ title, description, badge, actions }: PageHeaderProps) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          {badge && (
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
              {badge}
            </span>
          )}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">{title}</h1>
            {description && <p className="text-sm text-slate-600 md:max-w-3xl">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
};
