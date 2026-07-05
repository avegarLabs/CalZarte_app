export const dynamic = "force-dynamic";

import { listarArqueos, obtenerCajaAbierta } from "@/services/caja.service";
import { formatMoney } from "@/lib/money";
import { MONEDA_NACIONAL, MONEDAS, type Moneda } from "@/db/constants";
import { DENOMINACIONES, MONEDAS_LABEL } from "@/lib/denominaciones";
import { ArqueoForm } from "./arqueo-form";

export default function CajaPage() {
  const arqueos = listarArqueos();
  const cajaAbierta = obtenerCajaAbierta();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Caja</h1>

      {/* Estado actual */}
      {cajaAbierta && (
        <div className="rounded-lg border-2 border-primary bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">Caja Actual</h2>
              <p className="text-xs text-muted">
                Registrado:{" "}
                {cajaAbierta.caja.fecha.toLocaleDateString("es-CU")}{" "}
                {cajaAbierta.caja.fecha.toLocaleTimeString("es-CU")}
                {cajaAbierta.caja.notas && ` — ${cajaAbierta.caja.notas}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted uppercase tracking-wide">
                Total General
              </p>
              <p className="text-2xl font-bold text-success font-mono">
                {formatMoney(cajaAbierta.totalCupCents, MONEDA_NACIONAL)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {MONEDAS.map((moneda) => {
              const totalCents = cajaAbierta.totalesPorMoneda[moneda];
              if (!totalCents) return null;

              const detallesMoneda = cajaAbierta.detalles
                .filter((d) => d.moneda === moneda)
                .sort((a, b) => b.denominacionCents - a.denominacionCents);

              const tasa = cajaAbierta.tasasUsadas[moneda];

              return (
                <div
                  key={moneda}
                  className="rounded-md border border-border bg-background p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{moneda}</span>
                    <span className="font-mono font-bold text-sm">
                      {formatMoney(totalCents, moneda)}
                    </span>
                  </div>
                  {tasa && (
                    <p className="text-xs text-muted">
                      Tasa: {formatMoney(tasa, MONEDA_NACIONAL)}
                    </p>
                  )}
                  <div className="text-xs text-muted space-y-0.5">
                    {detallesMoneda.map((d) => {
                      const denom = DENOMINACIONES[moneda as Moneda]?.find(
                        (x) => x.valorCents === d.denominacionCents,
                      );
                      return (
                        <div
                          key={d.id}
                          className="flex justify-between font-mono"
                        >
                          <span>
                            {denom?.label ?? d.denominacionCents} × {d.cantidad}
                          </span>
                          <span>
                            {formatMoney(
                              d.denominacionCents * d.cantidad,
                              moneda,
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <a
            href={`/api/export/caja-pdf?id=${cajaAbierta.caja.id}`}
            className="inline-flex items-center gap-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Exportar PDF
          </a>
        </div>
      )}

      {/* Formulario nuevo arqueo */}
      <ArqueoForm />

      {/* Historial */}
      {arqueos.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Historial de Arqueos</h2>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-left text-muted">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Monedas</th>
                  <th className="px-4 py-3 text-right">Total CUP</th>
                  <th className="px-4 py-3">Notas</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody>
                {arqueos.map((a) => (
                  <tr
                    key={a.caja.id}
                    className={`border-b border-border last:border-0 hover:bg-background/50 ${
                      a.caja.status === "CLOSED" ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-muted">{a.caja.id}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {a.caja.fecha.toLocaleDateString("es-CU")}{" "}
                      {a.caja.fecha.toLocaleTimeString("es-CU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {Object.entries(a.totalesPorMoneda)
                        .map(
                          ([m, cents]) => `${formatMoney(cents, m)}`,
                        )
                        .join(" | ")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-success">
                      {formatMoney(a.totalCupCents, MONEDA_NACIONAL)}
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      {a.caja.notas || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.caja.status === "OPEN"
                            ? "bg-green-100 text-success"
                            : "bg-gray-100 text-muted"
                        }`}
                      >
                        {a.caja.status === "OPEN" ? "Abierta" : "Cerrada"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/api/export/caja-pdf?id=${a.caja.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
