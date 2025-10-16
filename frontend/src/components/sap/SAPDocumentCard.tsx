import { RefreshCcw } from 'lucide-react';
import type { ReactNode } from 'react';

interface SAPDocumentCardProps {
  title: string;
  subtitle: string;
  documentCode: string;
  status?: { type: 'success' | 'error'; message: string } | null;
  onReset?: () => void;
  children: ReactNode;
}

export const SAPDocumentCard = ({ title, subtitle, documentCode, status, onReset, children }: SAPDocumentCardProps) => (
  <section className="card space-y-6 p-6">
    <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">{documentCode}</p>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>
      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-primary/50 hover:text-primary"
        >
          <RefreshCcw size={14} />
          Limpiar documento
        </button>
      ) : null}
    </header>
    {status ? (
      <div
        className={`rounded-xl border px-4 py-3 text-sm ${
          status.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-rose-200 bg-rose-50 text-rose-700'
        }`}
      >
        {status.message}
      </div>
    ) : null}
    {children}
  </section>
);
