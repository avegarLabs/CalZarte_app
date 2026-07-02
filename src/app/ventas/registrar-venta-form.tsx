"use client";

import { useRef, useState } from "react";

import { registrarVentaAction } from "@/app/actions/venta.actions";

interface ProductoConPrecio {
  id: number;
  descripcion: string;
  cantidad: number;
  precioLabel: string;
  precioCupLabel: string | null;
}

export function RegistrarVentaForm({
  productos,
}: {
  productos: ProductoConPrecio[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProductoConPrecio | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleProductoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelected(productos.find((p) => p.id === id) ?? null);
  };

  return (
    <form
      ref={formRef}
      className="rounded-lg border border-border bg-card p-4 space-y-3"
      action={async (formData) => {
        setError(null);
        const result = await registrarVentaAction(formData);
        if (result.success) {
          formRef.current?.reset();
          setSelected(null);
        } else {
          setError(result.error);
        }
      }}
    >
      <h3 className="font-semibold">Registrar Venta</h3>
      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="block text-xs text-muted mb-1">Producto</label>
          <select
            name="productoId"
            required
            onChange={handleProductoChange}
            defaultValue=""
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="" disabled>
              Seleccionar producto...
            </option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.descripcion} (stock: {p.cantidad})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-muted mb-1">Cantidad</label>
          <input
            name="cantidad"
            type="number"
            min="1"
            max={selected?.cantidad}
            defaultValue="1"
            required
            className="w-24 rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Registrar Venta
        </button>
      </div>

      {selected && (
        <div className="flex gap-4 rounded-md bg-background p-3 text-sm">
          <div>
            <span className="text-muted">Precio: </span>
            <span className="font-mono font-medium">
              {selected.precioLabel}
            </span>
          </div>
          {selected.precioCupLabel && (
            <div>
              <span className="text-muted">Equiv. CUP: </span>
              <span className="font-mono font-medium text-success">
                {selected.precioCupLabel}
              </span>
            </div>
          )}
          <div>
            <span className="text-muted">Stock: </span>
            <span>{selected.cantidad}</span>
          </div>
        </div>
      )}
    </form>
  );
}
