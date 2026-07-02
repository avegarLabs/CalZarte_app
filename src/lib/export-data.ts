import { MONEDA_NACIONAL } from "@/db/constants";
import type { CorteVentaItem } from "@/services/corte-venta.service";
import { formatMoney, fromCents } from "./money";

/**
 * Estructura de fila plana para exportaciones (Excel/PDF).
 */
export interface ExportRow {
  id: number;
  producto: string;
  cantidad: number;
  precioUnit: string;
  moneda: string;
  tasa: string;
  total: string;
  totalCUP: string;
  estado: string;
  fecha: string;
}

export function toExportRows(items: CorteVentaItem[]): ExportRow[] {
  return items.map((item) => {
    const totalNac =
      item.totalNacionalCents != null
        ? formatMoney(item.totalNacionalCents, MONEDA_NACIONAL)
        : item.precioMoneda === MONEDA_NACIONAL
          ? formatMoney(item.totalOriginalCents, MONEDA_NACIONAL)
          : "-";

    return {
      id: item.ventaId,
      producto: item.productoDescripcion,
      cantidad: item.cantidad,
      precioUnit: fromCents(item.precioValorCents).toFixed(2),
      moneda: item.precioMoneda,
      tasa:
        item.tasaValorCents != null
          ? fromCents(item.tasaValorCents).toFixed(2)
          : "—",
      total: fromCents(item.totalOriginalCents).toFixed(2),
      totalCUP: totalNac,
      estado: item.ventaStatus === "COMPLETED" ? "Completada" : "Cancelada",
      fecha: item.ventaCreatedAt.toLocaleDateString("es-CU"),
    };
  });
}

export const EXPORT_COLUMNS = [
  { key: "id", header: "#", width: 6 },
  { key: "fecha", header: "Fecha", width: 14 },
  { key: "producto", header: "Producto", width: 28 },
  { key: "cantidad", header: "Cant.", width: 8 },
  { key: "precioUnit", header: "Precio Unit.", width: 14 },
  { key: "moneda", header: "Moneda", width: 8 },
  { key: "tasa", header: "Tasa CUP", width: 12 },
  { key: "total", header: "Total", width: 14 },
  { key: "totalCUP", header: "Total CUP", width: 16 },
  { key: "estado", header: "Estado", width: 12 },
] as const;
