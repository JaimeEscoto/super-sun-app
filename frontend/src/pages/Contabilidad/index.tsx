import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';

import { Column, DataTable } from '@/components/cards/DataTable';
import { PageHeader } from '@/components/layout/PageHeader';
import { SAPDocumentCard } from '@/components/sap/SAPDocumentCard';
import api from '@/lib/api';

interface Asiento {
  id: string;
  fecha: string;
  diario: string;
  descripcion: string;
  total_debe: string;
  total_haber: string;
}

type JournalLineState = {
  id: string;
  cuentaId: string;
  debe: string;
  haber: string;
  docRef: string;
};

const buildId = () => (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));

export const ContabilidadPage = () => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [journalForm, setJournalForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    diario: 'VENTAS',
    descripcion: 'Registro manual',
    lineas: [
      {
        id: buildId(),
        cuentaId: '4101-VENTAS',
        debe: '0',
        haber: '1000',
        docRef: 'PED-REF'
      },
      {
        id: buildId(),
        cuentaId: '1101-CLIENTES',
        debe: '1000',
        haber: '0',
        docRef: 'PED-REF'
      }
    ] as JournalLineState[]
  });

  const { data } = useQuery({
    queryKey: ['contabilidad', 'asientos'],
    queryFn: async () => {
      const response = await api.get<{ data: Asiento[] }>('/contabilidad/asientos');
      return response.data.data;
    }
  });

  const journalMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        fecha: journalForm.fecha,
        diario: journalForm.diario,
        descripcion: journalForm.descripcion,
        lineas: journalForm.lineas.map((linea) => ({
          cuentaId: linea.cuentaId,
          centroCostoId: null,
          debe: Number(linea.debe) || 0,
          haber: Number(linea.haber) || 0,
          docRef: linea.docRef || null
        }))
      };

      const { data: response } = await api.post('/contabilidad/asientos', payload);
      return response;
    },
    onSuccess: () => {
      setStatus({
        type: 'success',
        message: 'Asiento contable registrado y reflejado en el diario general.'
      });
      queryClient.invalidateQueries({ queryKey: ['contabilidad', 'asientos'] });
    },
    onError: (error) => {
      const message =
        (axios.isAxiosError(error) && error.response?.data?.message) || 'No se pudo registrar el asiento.';
      setStatus({ type: 'error', message });
    }
  });

  const totals = useMemo(() => {
    const debe = journalForm.lineas.reduce((acc, linea) => acc + (Number(linea.debe) || 0), 0);
    const haber = journalForm.lineas.reduce((acc, linea) => acc + (Number(linea.haber) || 0), 0);
    return { debe, haber };
  }, [journalForm.lineas]);

  const handleLineChange = (id: string, field: keyof JournalLineState, value: string) => {
    setJournalForm((prev) => ({
      ...prev,
      lineas: prev.lineas.map((linea) =>
        linea.id === id
          ? {
              ...linea,
              [field]: value
            }
          : linea
      )
    }));
  };

  const resetForm = () => {
    setStatus(null);
    setJournalForm({
      fecha: new Date().toISOString().slice(0, 10),
      diario: 'VENTAS',
      descripcion: 'Registro manual',
      lineas: [
        {
          id: buildId(),
          cuentaId: '4101-VENTAS',
          debe: '0',
          haber: '1000',
          docRef: 'PED-REF'
        },
        {
          id: buildId(),
          cuentaId: '1101-CLIENTES',
          debe: '1000',
          haber: '0',
          docRef: 'PED-REF'
        }
      ]
    });
  };

  const columns: Column<Asiento>[] = [
    { header: 'Fecha', accessor: 'fecha' },
    { header: 'Diario', accessor: 'diario' },
    { header: 'Descripción', accessor: 'descripcion' },
    { header: 'Debe', accessor: 'total_debe' },
    { header: 'Haber', accessor: 'total_haber' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Contabilidad financiera"
        description="Automatiza pólizas, conciliaciones y estados financieros bajo NIIF Pymes con auditoría y trazabilidad completa."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <SAPDocumentCard
          title="Asiento contable"
          subtitle="Documento contable al estilo SAP B1 con partidas balanceadas."
          documentCode="JOURNAL ENTRY"
          status={status}
          onReset={resetForm}
        >
          <form
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              setStatus(null);
              journalMutation.mutate();
            }}
            className="space-y-6"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-1 text-sm text-slate-600">
                Fecha
                <input
                  type="date"
                  value={journalForm.fecha}
                  onChange={(event) => setJournalForm((prev) => ({ ...prev, fecha: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-600">
                Diario
                <input
                  type="text"
                  value={journalForm.diario}
                  onChange={(event) => setJournalForm((prev) => ({ ...prev, diario: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1 text-sm text-slate-600">
                Glosa
                <input
                  type="text"
                  value={journalForm.descripcion}
                  onChange={(event) => setJournalForm((prev) => ({ ...prev, descripcion: event.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-700">Partidas contables</h4>
                <button
                  type="button"
                  onClick={() =>
                    setJournalForm((prev) => ({
                      ...prev,
                      lineas: [
                        ...prev.lineas,
                        {
                          id: buildId(),
                          cuentaId: '9999-AJUSTE',
                          debe: '0',
                          haber: '0',
                          docRef: ''
                        }
                      ]
                    }))
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                >
                  <Plus size={14} />
                  Agregar línea
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-y-2 text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="text-left">Cuenta</th>
                      <th className="w-28 text-right">Debe</th>
                      <th className="w-28 text-right">Haber</th>
                      <th className="w-32 text-left">Documento</th>
                      <th className="w-12">&nbsp;</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalForm.lineas.map((linea) => (
                      <tr key={linea.id} className="bg-white">
                        <td className="rounded-l-xl border border-slate-200 px-3 py-2">
                          <input
                            type="text"
                            value={linea.cuentaId}
                            onChange={(event) => handleLineChange(linea.id, 'cuentaId', event.target.value)}
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={linea.debe}
                            onChange={(event) => handleLineChange(linea.id, 'debe', event.target.value)}
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-right"
                          />
                        </td>
                        <td className="border border-slate-200 px-3 py-2 text-right">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={linea.haber}
                            onChange={(event) => handleLineChange(linea.id, 'haber', event.target.value)}
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-right"
                          />
                        </td>
                        <td className="border border-slate-200 px-3 py-2">
                          <input
                            type="text"
                            value={linea.docRef}
                            onChange={(event) => handleLineChange(linea.id, 'docRef', event.target.value)}
                            className="w-full rounded-md border border-slate-200 px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="rounded-r-xl border border-slate-200 px-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setJournalForm((prev) => ({
                                ...prev,
                                lineas:
                                  prev.lineas.length === 2
                                    ? prev.lineas
                                    : prev.lineas.filter((item) => item.id !== linea.id)
                              }))
                            }
                            className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <footer className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
              <div>
                <p>
                  Total debe: <strong>L {totals.debe.toFixed(2)}</strong>
                </p>
                <p>
                  Total haber: <strong>L {totals.haber.toFixed(2)}</strong>
                </p>
              </div>
              <button
                type="submit"
                disabled={journalMutation.isPending}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 disabled:bg-slate-300"
              >
                {journalMutation.isPending ? 'Registrando…' : 'Registrar asiento'}
              </button>
            </footer>
          </form>
        </SAPDocumentCard>

        <div className="space-y-6">
          <DataTable<Asiento>
            title="Diario general"
            data={data ?? []}
            columns={columns}
          />
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Cierres y estados financieros</h3>
            <p className="text-sm text-slate-300">
              Automatiza provisiones, depreciaciones y conciliación bancaria. Genera balanza, estado de resultados y flujo de efectivo (método indirecto) con soporte de centros de costo y anexos exigidos por el SAR en Honduras.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
