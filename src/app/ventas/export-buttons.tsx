"use client";

import { useState } from "react";

export function ExportButtons() {
  const [mode, setMode] = useState<"full" | "period">("full");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const queryStr =
    mode === "period" && desde && hasta
      ? `?desde=${desde}&hasta=${hasta}T23:59:59`
      : "";

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h3 className="font-semibold">Exportar Ventas</h3>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-muted mb-1">Modo</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as "full" | "period")}
            className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="full">Todas las ventas</option>
            <option value="period">Por periodo</option>
          </select>
        </div>

        {mode === "period" && (
          <>
            <div>
              <label className="block text-xs text-muted mb-1">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </>
        )}

        <a
          href={`/api/export/excel${queryStr}`}
          className="inline-flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Excel
        </a>

        <a
          href={`/api/export/pdf${queryStr}`}
          className="inline-flex items-center gap-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          PDF
        </a>
      </div>

      {mode === "period" && (!desde || !hasta) && (
        <p className="text-xs text-muted">
          Seleccione ambas fechas para exportar por periodo.
        </p>
      )}
    </div>
  );
}
