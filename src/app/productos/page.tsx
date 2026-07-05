export const dynamic = "force-dynamic";

import { obtenerProductos } from "@/services/producto.service";
import { obtenerPrecioActivo } from "@/services/precio.service";
import { obtenerTasaActiva } from "@/services/tasa-cambio.service";
import { formatMoney, convertToNationalCents, isNacional } from "@/lib/money";
import { MONEDAS, MONEDA_NACIONAL } from "@/db/constants";
import { NuevoProductoForm } from "./nuevo-producto-form";
import { CambiarPrecioForm } from "./cambiar-precio-form";

export default function ProductosPage() {
  const productos = obtenerProductos();

  const productosConPrecio = productos.map((p) => {
    const precioActivo = obtenerPrecioActivo(p.id);
    let precioCUP: number | null = null;

    if (precioActivo && !isNacional(precioActivo.moneda)) {
      const tasa = obtenerTasaActiva(precioActivo.moneda as typeof MONEDAS[number]);
      if (tasa) {
        precioCUP = convertToNationalCents(precioActivo.valorCents, tasa.valorCents);
      }
    }

    return { producto: p, precioActivo, precioCUP };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
      </div>

      <NuevoProductoForm monedas={MONEDAS.filter((m) => m !== MONEDA_NACIONAL)} />

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background text-left text-muted">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Descripcion</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-right">Equiv. CUP</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosConPrecio.map(({ producto, precioActivo, precioCUP }) => (
              <tr
                key={producto.id}
                className="border-b border-border last:border-0 hover:bg-background/50"
              >
                <td className="px-4 py-3 text-muted">{producto.id}</td>
                <td className="px-4 py-3 font-medium">{producto.descripcion}</td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={
                      producto.cantidad === 0
                        ? "font-semibold text-danger"
                        : producto.cantidad < 5
                          ? "text-yellow-600"
                          : ""
                    }
                  >
                    {producto.cantidad}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {precioActivo
                    ? formatMoney(precioActivo.valorCents, precioActivo.moneda)
                    : <span className="text-muted">Sin precio</span>}
                </td>
                <td className="px-4 py-3 text-right font-mono text-muted">
                  {precioCUP != null
                    ? formatMoney(precioCUP, "CUP")
                    : precioActivo && isNacional(precioActivo.moneda)
                      ? "-"
                      : <span className="text-danger text-xs">Sin tasa</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <CambiarPrecioForm
                    productoId={producto.id}
                    monedaActual={precioActivo?.moneda ?? "USD"}
                  />
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">
                  No hay productos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
