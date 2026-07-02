"use client";

import { useRef, useState } from "react";

import { crearArqueoAction } from "@/app/actions/caja.actions";
import { DENOMINACIONES, MONEDAS_LABEL } from "@/lib/denominaciones";
import type { Moneda } from "@/db/constants";

type Cantidades = Record<string, Record<number, number>>;

function initCantidades(): Cantidades {
  const c: Cantidades = {};
  for (const [moneda, denoms] of Object.entries(DENOMINACIONES)) {
    c[moneda] = {};
    for (const d of denoms) {
      c[moneda][d.valorCents] = 0;
    }
  }
  return c;
}

function calcSubtotal(
  moneda: string,
  cantidades: Cantidades,
): number {
  let total = 0;
  const denoms = DENOMINACIONES[moneda as Moneda];
  for (const d of denoms) {
    total += d.valorCents * (cantidades[moneda]?.[d.valorCents] ?? 0);
  }
  return total;
}

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("es-CU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ArqueoForm() {
  const [cantidades, setCantidades] = useState<Cantidades>(initCantidades);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const setCantidad = (
    moneda: string,
    denomCents: number,
    value: number,
  ) => {
    setCantidades((prev) => ({
      ...prev,
      [moneda]: {
        ...prev[moneda],
        [denomCents]: Math.max(0, value),
      },
    }));
  };

  const hasAnyQuantity = Object.values(cantidades).some((denoms) =>
    Object.values(denoms).some((q) => q > 0),
  );

  return (
    <form
      ref={formRef}
      className="space-y-4"
      action={async (formData) => {
        setError(null);
        setSuccess(false);
        formData.set("cantidades", JSON.stringify(cantidades));
        const result = await crearArqueoAction(formData);
        if (result.success) {
          setCantidades(initCantidades());
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } else {
          setError(result.error);
        }
      }}
    >
      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
        <h2 className="text-lg font-bold">Nuevo Arqueo de Caja</h2>
        <p className="text-xs text-muted">
          Ingrese la cantidad de billetes/monedas por cada denominación.
        </p>
        {error && <p className="text-sm text-danger">{error}</p>}
        {success && (
          <p className="text-sm text-success">Arqueo registrado exitosamente</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {(Object.entries(DENOMINACIONES) as [Moneda, typeof DENOMINACIONES[Moneda]][]).map(
          ([moneda, denoms]) => {
            const subtotalCents = calcSubtotal(moneda, cantidades);

            return (
              <div
                key={moneda}
                className="rounded-lg border border-border bg-card overflow-hidden"
              >
                <div className="bg-background px-4 py-3 border-b border-border">
                  <h3 className="font-semibold text-sm">
                    {MONEDAS_LABEL[moneda]}
                  </h3>
                </div>

                <div className="divide-y divide-border">
                  {denoms.map((d) => {
                    const qty = cantidades[moneda]?.[d.valorCents] ?? 0;
                    const lineTotal = d.valorCents * qty;

                    return (
                      <div
                        key={d.valorCents}
                        className="flex items-center gap-2 px-4 py-2"
                      >
                        <span className="w-16 text-sm font-mono font-medium">
                          {d.label}
                        </span>
                        <span className="text-muted text-xs">×</span>
                        <input
                          type="number"
                          min={0}
                          value={qty || ""}
                          onChange={(e) =>
                            setCantidad(
                              moneda,
                              d.valorCents,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          placeholder="0"
                          className="w-16 rounded-md border border-border px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <span className="text-muted text-xs">=</span>
                        <span className="flex-1 text-right text-sm font-mono">
                          {lineTotal > 0
                            ? formatCents(lineTotal)
                            : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-background px-4 py-3 border-t border-border flex items-center justify-between">
                  <span className="text-sm font-medium text-muted">
                    Subtotal
                  </span>
                  <span className="text-base font-bold font-mono text-success">
                    {formatCents(subtotalCents)} {moneda}
                  </span>
                </div>
              </div>
            );
          },
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-muted mb-1">
            Notas (opcional)
          </label>
          <input
            name="notas"
            type="text"
            placeholder="ej: Cierre del día, apertura de caja"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="submit"
          disabled={!hasAnyQuantity}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Registrar Arqueo
        </button>
      </div>
    </form>
  );
}
