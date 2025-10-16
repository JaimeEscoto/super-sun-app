import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
}

export const StatCard = ({ title, value, subtitle, icon }: StatCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-100 shadow-[0_30px_60px_-45px_rgba(30,64,175,0.8)]">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.25),transparent_60%)]" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">{title}</p>
          <p className="text-3xl font-semibold text-white md:text-4xl">{value}</p>
          {subtitle && <p className="text-sm text-white/70">{subtitle}</p>}
        </div>
        {icon && (
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 text-primary">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
};
