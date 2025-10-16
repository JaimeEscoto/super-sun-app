import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  actions?: ReactNode;
}

export const PageHeader = ({ title, description, badge, actions }: PageHeaderProps) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-6 py-8 shadow-[0_35px_80px_-45px_rgba(59,130,246,0.7)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_55%)]" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4">
          {badge && (
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/60 bg-primary/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
              {badge}
            </span>
          )}
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-white md:text-4xl">{title}</h1>
            {description && <p className="text-sm leading-relaxed text-white/70 md:max-w-3xl">{description}</p>}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
