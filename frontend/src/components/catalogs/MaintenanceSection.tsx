import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Column, DataTable } from '@/components/cards/DataTable';
import api from '@/lib/api';

export type MaintenanceField<FormValues extends Record<string, unknown>> = {
  name: keyof FormValues;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  step?: string;
  options?: { value: string; label: string }[];
};

interface MaintenanceSectionProps<
  FormValues extends Record<string, unknown>,
  Row extends { id: string }
> {
  title: string;
  endpoint: string;
  queryKey: (string | number)[];
  columns: Column<Row>[];
  fields: MaintenanceField<FormValues>[];
  initialValues: FormValues;
  mapRowToForm: (row: Row) => FormValues;
  mapFormToPayload: (values: FormValues) => Record<string, unknown>;
  successMessage?: string;
  description?: string;
}

interface ListResponse<Row> {
  data: Row[];
}

export function MaintenanceSection<
  FormValues extends Record<string, unknown>,
  Row extends { id: string }
>({
  title,
  endpoint,
  queryKey,
  columns,
  fields,
  initialValues,
  mapRowToForm,
  mapFormToPayload,
  successMessage = 'Guardado correctamente',
  description
}: MaintenanceSectionProps<FormValues, Row>) {
  const queryClient = useQueryClient();
  const [formValues, setFormValues] = useState<FormValues>({ ...initialValues });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resolveErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      if (response?.data?.message && typeof response.data.message === 'string') {
        return response.data.message;
      }
    }
    if (error instanceof Error) {
      return error.message;
    }
    return fallback;
  };

  const { data: rows, isLoading } = useQuery<Row[]>({
    queryKey,
    queryFn: async () => {
      const response = await api.get<ListResponse<Row> | Row[]>(`/catalogos/${endpoint}`);
      if ('data' in response.data) {
        return response.data.data;
      }
      return response.data;
    }
  });

  const submitMutation = useMutation({
    mutationFn: async ({ values, id }: { values: FormValues; id: string | null }) => {
      const payload = mapFormToPayload(values);
      if (id) {
        await api.put(`/catalogos/${endpoint}/${id}`, payload);
        return 'updated';
      }
      await api.post(`/catalogos/${endpoint}`, payload);
      return 'created';
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/catalogos/${endpoint}/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
    }
  });

  const resetForm = () => {
    setFormValues({ ...initialValues });
    setEditingId(null);
  };

  const handleInputChange = (name: keyof FormValues, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    try {
      await submitMutation.mutateAsync({ values: formValues, id: editingId });
      setMessage(editingId ? 'Registro actualizado correctamente' : successMessage);
      resetForm();
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error, 'No se pudo guardar el registro'));
    }
  };

  const handleEdit = (row: Row) => {
    setFormValues(mapRowToForm(row));
    setEditingId(row.id);
    setMessage(null);
    setErrorMessage(null);
  };

  const handleDelete = async (row: Row) => {
    const confirmation = window.confirm('¿Deseas eliminar este registro?');
    if (!confirmation) {
      return;
    }

    setMessage(null);
    setErrorMessage(null);
    try {
      await deleteMutation.mutateAsync(row.id);
      setMessage('Registro eliminado correctamente');
      if (editingId === row.id) {
        resetForm();
      }
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error, 'No se pudo eliminar el registro'));
    }
  };

  const tableColumns: Column<Row>[] = [
    ...columns,
    {
      header: 'Acciones',
      accessor: 'id' as keyof Row,
      render: (_value: Row[keyof Row], row: Row) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleEdit(row)}
            className="text-xs font-semibold text-amber-400 hover:text-amber-200"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="text-xs font-semibold text-rose-400 hover:text-rose-200"
          >
            Eliminar
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{editingId ? `Editar ${title}` : `Nuevo ${title}`}</h3>
          {description && <p className="text-sm text-slate-300 mt-1">{description}</p>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div key={String(field.name)} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-200" htmlFor={`${endpoint}-${String(field.name)}`}>
                {field.label}
              </label>
              {field.type === 'select' ? (
                <select
                  id={`${endpoint}-${String(field.name)}`}
                  value={(formValues[field.name] as string) ?? ''}
                  onChange={(event) => handleInputChange(field.name, event.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  required={field.required}
                >
                  <option value="">Seleccione una opción</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`${endpoint}-${String(field.name)}`}
                  type={field.type}
                  value={(formValues[field.name] as string) ?? ''}
                  onChange={(event) => handleInputChange(field.name, event.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  step={field.step}
                  className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-400"
            >
              Cancelar
            </button>
          )}
        </div>
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        {errorMessage && <p className="text-sm text-rose-400">{errorMessage}</p>}
      </form>

      <DataTable<Row>
        title={`Listado de ${title.toLowerCase()}`}
        data={rows ?? []}
        columns={tableColumns}
        emptyMessage={isLoading ? 'Cargando...' : 'No hay registros disponibles'}
      />
    </div>
  );
}
