import {
  obtenerTasasActivas,
  obtenerTodasLasTasas,
} from "@/services/tasa-cambio.service";
import { formatMoney, fromCents } from "@/lib/money";
import { MONEDAS, MONEDA_NACIONAL } from "@/db/constants";
import { FijarTasaForm } from "./fijar-tasa-form";
import { EditarTasaForm } from "./editar-tasa-form";
import { EliminarTasaButton } from "./eliminar-tasa-button";

export default function TasasPage() {
  const monedasExtranjeras = MONEDAS.filter((m) => m !== MONEDA_NACIONAL);
  const tasasActivas = obtenerTasasActivas();
  const todasLasTasas = obtenerTodasLasTasas();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tasas de Cambio</h1>
      <p className="text-sm text-muted">
        Valor de 1 unidad de moneda extranjera en {MONEDA_NACIONAL}.
      </p>

      {/* Resumen de tasas activas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {monedasExtranjeras.map((moneda) => {
          const activa = tasasActivas.find((t) => t.moneda === moneda);
          return (
            <div
              key={moneda}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">{moneda}</span>
                {activa ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-success">
                    Activa
                  </span>
                ) : (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-danger">
                    Sin tasa
                  </span>
                )}
              </div>
              <p className="mt-1 text-2xl font-bold font-mono">
                {activa
                  ? formatMoney(activa.valorCents, MONEDA_NACIONAL)
                  : "—"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Formulario crear nueva tasa */}
      <FijarTasaForm monedas={monedasExtranjeras} />

      {/* Tabla CRUD completa */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background text-left text-muted">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Moneda</th>
              <th className="px-4 py-3 text-right">Valor ({MONEDA_NACIONAL})</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {todasLasTasas.map((tasa) => (
              <tr
                key={tasa.id}
                className={`border-b border-border last:border-0 hover:bg-background/50 ${
                  tasa.status === "INACTIVE" ? "opacity-50" : ""
                }`}
              >
                <td className="px-4 py-3 text-muted">{tasa.id}</td>
                <td className="px-4 py-3 font-medium">{tasa.moneda}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatMoney(tasa.valorCents, MONEDA_NACIONAL)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      tasa.status === "ACTIVE"
                        ? "bg-green-100 text-success"
                        : "bg-gray-100 text-muted"
                    }`}
                  >
                    {tasa.status === "ACTIVE" ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {tasa.status === "ACTIVE" && (
                      <EditarTasaForm
                        tasaId={tasa.id}
                        valorActual={fromCents(tasa.valorCents)}
                      />
                    )}
                    <EliminarTasaButton
                      tasaId={tasa.id}
                      moneda={tasa.moneda}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {todasLasTasas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No hay tasas de cambio registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
