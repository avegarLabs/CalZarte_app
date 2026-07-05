export const dynamic = "force-dynamic";

import { obtenerProductos } from "@/services/producto.service";
import { obtenerPrecioActivo } from "@/services/precio.service";
import { obtenerTasaActiva } from "@/services/tasa-cambio.service";
import { listarVentas } from "@/services/venta.service";
import { listarCortes } from "@/services/corte-venta.service";
import {
  formatMoney,
  convertToNationalCents,
  isNacional,
} from "@/lib/money";
import { MONEDA_NACIONAL, type Moneda } from "@/db/constants";
import { RegistrarVentaForm } from "./registrar-venta-form";
import { CancelarVentaButton } from "./cancelar-venta-button";
import { ExportButtons } from "./export-buttons";
import { CorteVentaForm } from "./corte-venta-form";

interface ProductoConPrecio {
  id: number;
  descripcion: string;
  cantidad: number;
  precioLabel: string;
  precioCupLabel: string | null;
}

export default function VentasPage() {
  const productos = obtenerProductos();
  const ventas = listarVentas();
  const cortes = listarCortes();

  const productosConPrecio: ProductoConPrecio[] = productos
    .filter((p) => p.cantidad > 0)
    .map((p) => {
      const precio = obtenerPrecioActivo(p.id);
      if (!precio) {
        return {
          id: p.id,
          descripcion: p.descripcion,
          cantidad: p.cantidad,
          precioLabel: "Sin precio",
          precioCupLabel: null,
        };
      }

      const precioLabel = formatMoney(precio.valorCents, precio.moneda);
      let precioCupLabel: string | null = null;

      if (!isNacional(precio.moneda)) {
        const tasa = obtenerTasaActiva(precio.moneda as Moneda);
        if (tasa) {
          const cupCents = convertToNationalCents(
            precio.valorCents,
            tasa.valorCents,
          );
          precioCupLabel = formatMoney(cupCents, MONEDA_NACIONAL);
        } else {
          precioCupLabel = "Sin tasa";
        }
      }

      return {
        id: p.id,
        descripcion: p.descripcion,
        cantidad: p.cantidad,
        precioLabel,
        precioCupLabel,
      };
    });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ventas</h1>

      {/* Registrar venta */}
      <RegistrarVentaForm productos={productosConPrecio} />

      {/* Tabla de ventas */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background text-left text-muted">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-right">Cant</th>
              <th className="px-4 py-3 text-right">Precio unit.</th>
              <th className="px-4 py-3 text-right">Tasa</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Total CUP</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr
                key={v.venta.id}
                className={`border-b border-border last:border-0 ${
                  v.venta.status === "CANCELLED" ? "opacity-50" : ""
                }`}
              >
                <td className="px-4 py-3 text-muted">{v.venta.id}</td>
                <td className="px-4 py-3">{v.productoDescripcion}</td>
                <td className="px-4 py-3 text-right">{v.venta.cantidad}</td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatMoney(v.precioValorCents, v.precioMoneda)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs">
                  {v.tasaValorCents != null ? (
                    <span className="text-amber-600">
                      {formatMoney(v.tasaValorCents, MONEDA_NACIONAL)}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono font-medium">
                  {formatMoney(v.totalOriginalCents, v.precioMoneda)}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {v.totalNacionalCents != null ? (
                    <span className="text-success font-medium">
                      {formatMoney(v.totalNacionalCents, MONEDA_NACIONAL)}
                    </span>
                  ) : (
                    <span className="text-muted">
                      {v.precioMoneda === MONEDA_NACIONAL
                        ? formatMoney(v.totalOriginalCents, MONEDA_NACIONAL)
                        : "-"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      v.venta.status === "COMPLETED"
                        ? "bg-green-100 text-success"
                        : "bg-red-100 text-danger"
                    }`}
                  >
                    {v.venta.status === "COMPLETED"
                      ? "Completada"
                      : "Cancelada"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {v.venta.status === "COMPLETED" && (
                    <CancelarVentaButton ventaId={v.venta.id} />
                  )}
                </td>
              </tr>
            ))}
            {ventas.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted">
                  No hay ventas registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Exportación */}
      <ExportButtons />

      {/* Corte de ventas */}
      <CorteVentaForm />

      {/* Tabla de cortes */}
      {cortes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Cortes de Ventas</h2>
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-left text-muted">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Periodo</th>
                  <th className="px-4 py-3 text-right">Ventas</th>
                  <th className="px-4 py-3 text-right">Total CUP</th>
                  <th className="px-4 py-3">Notas</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cortes.map((c) => (
                  <tr
                    key={c.corte.id}
                    className="border-b border-border last:border-0 hover:bg-background/50"
                  >
                    <td className="px-4 py-3 text-muted">{c.corte.id}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">
                        {c.corte.fechaInicio.toLocaleDateString("es-CU")}
                      </span>
                      <span className="text-muted mx-1">→</span>
                      <span className="font-mono text-xs">
                        {c.corte.fechaFin.toLocaleDateString("es-CU")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {c.ventasCount}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-success">
                      {formatMoney(c.totalNacionalCents, MONEDA_NACIONAL)}
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      {c.corte.notas || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {c.corte.status === "CLOSED" ? "Cerrado" : "Abierto"}
                      </span>
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
