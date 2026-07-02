"use client";

import { useRef, useState } from "react";

import { fijarTasaAction } from "@/app/actions/tasa.actions";

export function FijarTasaForm({
  monedas,
}: {
  monedas: readonly string[];
}) {
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
        const result = await fijarTasaAction(formData);
        if (result.success) {
          formRef.current?.reset();
          setSuccess(true);
          setTimeout(() => setSuccess(false), 2000);
        } else {
          setError(result.error);
        }
      }}
    >
      <h3 className="font-semibold">Fijar nueva tasa</h3>
      {error && <p className="text-sm text-danger">{error}</p>}
      {success && (
        <p className="text-sm text-success">Tasa actualizada</p>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Moneda</label>
          <select
            name="moneda"
            defaultValue={monedas[0]}
            className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {monedas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">
            Valor en CUP (por 1 unidad)
          </label>
          <input
            name="valor"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="ej: 420.00"
            className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          Fijar tasa
        </button>
      </div>
    </form>
  );
}
