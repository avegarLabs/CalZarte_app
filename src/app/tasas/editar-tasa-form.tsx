"use client";

import { useRef, useState } from "react";

import { actualizarTasaAction } from "@/app/actions/tasa.actions";

export function EditarTasaForm({
  tasaId,
  valorActual,
}: {
  tasaId: number;
  valorActual: number;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-primary hover:underline"
      >
        Editar
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      className="flex items-center gap-2"
      action={async (formData) => {
        setError(null);
        const result = await actualizarTasaAction(tasaId, formData);
        if (result.success) {
          setOpen(false);
        } else {
          setError(result.error);
        }
      }}
    >
      <input
        name="valor"
        type="number"
        step="0.01"
        min="0.01"
        required
        defaultValue={valorActual.toFixed(2)}
        className="w-24 rounded border border-border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
      <button
        type="submit"
        className="rounded bg-primary px-2 py-1 text-xs text-white hover:bg-primary-hover"
      >
        OK
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setError(null);
        }}
        className="text-xs text-muted hover:text-foreground"
      >
        X
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </form>
  );
}
