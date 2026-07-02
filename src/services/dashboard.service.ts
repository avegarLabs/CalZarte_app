import { desc, eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { precio, producto, tasaCambio, venta } from "@/db/schema";
import { convertToNationalCents, fromCents } from "@/lib/money";

export interface KPIs {
  totalProductos: number;
  totalStock: number;
  ventasCompletadas: number;
  ventasCanceladas: number;
  revenueCupCents: number;
}

export interface VentaDiaria {
  fecha: string;
  cantidad: number;
  totalCup: number;
}

export interface TopProducto {
  producto: string;
  cantidadVendida: number;
  totalCup: number;
}

export interface DashboardData {
  kpis: KPIs;
  ventasPorDia: VentaDiaria[];
  topProductos: TopProducto[];
}

export function obtenerDashboardData(): DashboardData {
  const productos = db.select().from(producto).all();
  const totalProductos = productos.length;
  const totalStock = productos.reduce((s, p) => s + p.cantidad, 0);

  const ventas = db
    .select({
      venta,
      precioValorCents: precio.valorCents,
      precioMoneda: precio.moneda,
      tasaValorCents: tasaCambio.valorCents,
      productoDescripcion: producto.descripcion,
    })
    .from(venta)
    .innerJoin(producto, eq(venta.productoId, producto.id))
    .innerJoin(precio, eq(venta.precioId, precio.id))
    .leftJoin(tasaCambio, eq(venta.tasaCambioId, tasaCambio.id))
    .orderBy(desc(venta.createdAt))
    .all();

  const completadas = ventas.filter((v) => v.venta.status === "COMPLETED");
  const canceladas = ventas.filter((v) => v.venta.status === "CANCELLED");

  let revenueCupCents = 0;
  for (const v of completadas) {
    const totalOrig = v.precioValorCents * v.venta.cantidad;
    if (v.tasaValorCents != null) {
      revenueCupCents += convertToNationalCents(totalOrig, v.tasaValorCents);
    } else {
      revenueCupCents += totalOrig;
    }
  }

  const kpis: KPIs = {
    totalProductos,
    totalStock,
    ventasCompletadas: completadas.length,
    ventasCanceladas: canceladas.length,
    revenueCupCents,
  };

  // Ventas por día
  const diaMap = new Map<string, { cantidad: number; totalCup: number }>();
  for (const v of completadas) {
    const fecha = v.venta.createdAt.toISOString().slice(0, 10);
    const entry = diaMap.get(fecha) ?? { cantidad: 0, totalCup: 0 };
    entry.cantidad += v.venta.cantidad;
    const totalOrig = v.precioValorCents * v.venta.cantidad;
    const cup =
      v.tasaValorCents != null
        ? convertToNationalCents(totalOrig, v.tasaValorCents)
        : totalOrig;
    entry.totalCup += fromCents(cup);
    diaMap.set(fecha, entry);
  }

  const ventasPorDia: VentaDiaria[] = Array.from(diaMap.entries())
    .map(([fecha, data]) => ({
      fecha,
      cantidad: data.cantidad,
      totalCup: Math.round(data.totalCup * 100) / 100,
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  // Top productos
  const prodMap = new Map<
    string,
    { cantidadVendida: number; totalCup: number }
  >();
  for (const v of completadas) {
    const nombre = v.productoDescripcion;
    const entry = prodMap.get(nombre) ?? { cantidadVendida: 0, totalCup: 0 };
    entry.cantidadVendida += v.venta.cantidad;
    const totalOrig = v.precioValorCents * v.venta.cantidad;
    const cup =
      v.tasaValorCents != null
        ? convertToNationalCents(totalOrig, v.tasaValorCents)
        : totalOrig;
    entry.totalCup += fromCents(cup);
    prodMap.set(nombre, entry);
  }

  const topProductos: TopProducto[] = Array.from(prodMap.entries())
    .map(([producto, data]) => ({
      producto,
      cantidadVendida: data.cantidadVendida,
      totalCup: Math.round(data.totalCup * 100) / 100,
    }))
    .sort((a, b) => b.totalCup - a.totalCup)
    .slice(0, 5);

  return { kpis, ventasPorDia, topProductos };
}
