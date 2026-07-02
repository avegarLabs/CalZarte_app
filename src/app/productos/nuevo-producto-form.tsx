"use client";

import { useRef, useState } from "react";

import type { Moneda } from "@/db/constants";
import { crearProductoAction } from "@/app/actions/producto.actions";

export function NuevoProductoForm({
  monedas,
}: {
  monedas: readonly string[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
      >
        + Nuevo Producto
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      className="rounded-lg border border-border bg-card p-4 space-y-3"
      action={async (formData) => {
        setError(null);
        const result = await crearProductoAction(formData);
        if (result.success) {
          formRef.current?.reset();
          setOpen(false);
        } else {
          setError(result.error);
        }
      }}
    >
      <h3 className="font-semibold">Nuevo Producto</h3>
      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input
          name="descripcion"
          placeholder="Descripcion del producto"
          required
          className="rounded-md border border-border px-3 py-2 text-sm sm:col-span-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <input
          name="cantidad"
          type="number"
          min="0"
          defaultValue="0"
          placeholder="Stock"
          className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex gap-2">
          <input
            name="precio"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="Precio"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <select
            name="moneda"
            defaultValue="USD"
            className="rounded-md border border-border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {monedas.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-background transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
