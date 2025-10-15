import { ReactNode } from 'react';

export interface Column<T extends object> {
  header: string;
  accessor: keyof T;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

export interface DataTableProps<T extends object> {
  title: string;
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
}

export function DataTable<T extends object>({
  title,
  columns,
  data,
  emptyMessage = 'Sin datos disponibles'
}: DataTableProps<T>) {
  return (
    <div className="card">
      <div className="border-b border-slate-200 px-6 py-5">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="overflow-x-auto px-2 pb-4">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={String(column.accessor)} scope="col" className="px-4 py-3">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6 text-center text-sm text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
            {data.map((row, index) => (
              <tr
                key={JSON.stringify(row)}
                className={`transition ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-primary/5`}
              >
                {columns.map((column) => (
                  <td key={String(column.accessor)} className="px-4 py-3 text-sm text-slate-700">
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
