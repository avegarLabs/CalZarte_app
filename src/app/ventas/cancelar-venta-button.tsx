"use client";

import { useState } from "react";

import { cancelarVentaAction } from "@/app/actions/venta.actions";

export function CancelarVentaButton({ ventaId }: { ventaId: number }) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="inline-flex items-center gap-1">
      <button
        onClick={async () => {
          setError(null);
          const result = await cancelarVentaAction(ventaId);
          if (!result.success) {
            setError(result.error);
          }
        }}
        className="text-xs text-danger hover:underline"
      >
        Cancelar
      </button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
