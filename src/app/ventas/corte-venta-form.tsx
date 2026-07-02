"use client";

import { useRef, useState } from "react";

import { crearCorteAction } from "@/app/actions/corte.actions";

export function CorteVentaForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="rounded-lg border border-border bg-card p-4 space-y-3"
      action={async (formData) => {
        setError(null);
        setSuccess(false);
        const result = await crearCorteAction(formData);
        if (result.success) {
          formRef.current?.reset();
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } else {
          setError(result.error);
        }
      }}
    >
      <h3 className="font-semibold">Crear Corte de Ventas</h3>
      <p className="text-xs text-muted">
        Cierra un periodo asignando todas las ventas completadas (sin corte
        previo) al nuevo corte.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      {success && (
        <p className="text-sm text-success">Corte creado exitosamente</p>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Fecha inicio</label>
          <input
            name="desde"
            type="date"
            required
            className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Fecha fin</label>
          <input
            name="hasta"
            type="date"
            required
            className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-muted mb-1">
            Notas (opcional)
          </label>
          <input
            name="notas"
            type="text"
            placeholder="ej: Cierre semanal"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          Crear Corte
        </button>
      </div>
    </form>
  );
}
