import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
}

export const StatCard = ({ title, value, subtitle, icon }: StatCardProps) => {
  return (
    <div className="card p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between text-slate-400 text-sm uppercase tracking-widest">
        {title}
        {icon}
      </div>
      <p className="text-3xl font-semibold text-white">{value}</p>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
};
