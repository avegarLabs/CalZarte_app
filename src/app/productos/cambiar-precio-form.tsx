"use client";

import { useRef, useState } from "react";

import { MONEDAS } from "@/db/constants";
import { cambiarPrecioAction } from "@/app/actions/precio.actions";

export function CambiarPrecioForm({
  productoId,
  monedaActual,
}: {
  productoId: number;
  monedaActual: string;
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
        Cambiar precio
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      className="flex items-center gap-2"
      action={async (formData) => {
        setError(null);
        const result = await cambiarPrecioAction(productoId, formData);
        if (result.success) {
          setOpen(false);
        } else {
          setError(result.error);
        }
      }}
    >
      <input
        name="precio"
        type="number"
        step="0.01"
        min="0.01"
        required
        placeholder="Nuevo"
        className="w-20 rounded border border-border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
      />
      <select
        name="moneda"
        defaultValue={monedaActual}
        className="rounded border border-border px-1 py-1 text-xs focus:outline-none"
      >
        {MONEDAS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
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
