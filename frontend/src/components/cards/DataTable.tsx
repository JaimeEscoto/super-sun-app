import { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

interface DataTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  title,
  columns,
  data,
  emptyMessage = 'Sin datos disponibles'
}: DataTableProps<T>) {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/60">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.accessor)}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-sm text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {data.map((row) => (
              <tr key={JSON.stringify(row)} className="hover:bg-slate-900/40">
                {columns.map((column) => (
                  <td key={String(column.accessor)} className="px-4 py-3 text-sm text-slate-300">
                    {column.render ? column.render(row[column.accessor], row) : (row[column.accessor] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
