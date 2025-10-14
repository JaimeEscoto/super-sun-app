import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
}

export const StatCard = ({ title, value, subtitle, icon }: StatCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-xl shadow-slate-950/30">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-transparent to-transparent" />
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{title}</p>
          <p className="text-3xl font-semibold text-white md:text-4xl">{value}</p>
          {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
        </div>
        {icon && (
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
};
