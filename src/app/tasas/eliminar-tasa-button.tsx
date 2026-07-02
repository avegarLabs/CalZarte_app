"use client";

import { useState } from "react";

import { eliminarTasaAction } from "@/app/actions/tasa.actions";

export function EliminarTasaButton({
  tasaId,
  moneda,
}: {
  tasaId: number;
  moneda: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs text-danger hover:underline"
      >
        Eliminar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted">Eliminar {moneda}?</span>
      <button
        onClick={async () => {
          setError(null);
          const result = await eliminarTasaAction(tasaId);
          if (result.success) {
            setConfirming(false);
          } else {
            setError(result.error);
          }
        }}
        className="rounded bg-danger px-2 py-0.5 text-xs text-white hover:bg-danger-hover"
      >
        Si
      </button>
      <button
        onClick={() => {
          setConfirming(false);
          setError(null);
        }}
        className="text-xs text-muted hover:text-foreground"
      >
        No
      </button>
      {error && (
        <span className="text-xs text-danger max-w-[200px] truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
