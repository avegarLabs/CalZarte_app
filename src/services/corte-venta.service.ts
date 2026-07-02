import { and, between, desc, eq, isNull, sql } from "drizzle-orm";

import { db, sqlite } from "@/db/connection";
import { MONEDA_NACIONAL } from "@/db/constants";
import {
  corteVenta,
  precio,
  producto,
  tasaCambio,
  venta,
  type CorteVenta,
} from "@/db/schema";
import { convertToNationalCents, formatMoney } from "@/lib/money";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

export interface CorteDetalle {
  corte: CorteVenta;
  ventasCount: number;
  /** Totales por moneda original: { USD: cents, EUR: cents, ... } */
  totalesPorMoneda: Record<string, number>;
  /** Total convertido a moneda nacional (centavos). */
  totalNacionalCents: number;
  ventas: CorteVentaItem[];
}

export interface CorteVentaItem {
  ventaId: number;
  productoDescripcion: string;
  cantidad: number;
  precioValorCents: number;
  precioMoneda: string;
  tasaValorCents: number | null;
  totalOriginalCents: number;
  totalNacionalCents: number | null;
  ventaStatus: string;
  ventaCreatedAt: Date;
}

export interface CorteResumen {
  corte: CorteVenta;
  ventasCount: number;
  totalNacionalCents: number;
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

function buildVentaItems(
  rows: {
    venta: typeof venta.$inferSelect;
    productoDescripcion: string;
    precioValorCents: number;
    precioMoneda: string;
    tasaValorCents: number | null;
  }[],
): CorteVentaItem[] {
  return rows.map((r) => {
    const totalOriginalCents = r.precioValorCents * r.venta.cantidad;
    const totalNacionalCents =
      r.tasaValorCents != null
        ? convertToNationalCents(totalOriginalCents, r.tasaValorCents)
        : null;

    return {
      ventaId: r.venta.id,
      productoDescripcion: r.productoDescripcion,
      cantidad: r.venta.cantidad,
      precioValorCents: r.precioValorCents,
      precioMoneda: r.precioMoneda,
      tasaValorCents: r.tasaValorCents,
      totalOriginalCents,
      totalNacionalCents,
      ventaStatus: r.venta.status,
      ventaCreatedAt: r.venta.createdAt,
    };
  });
}

function calcTotales(items: CorteVentaItem[]) {
  const totalesPorMoneda: Record<string, number> = {};
  let totalNacionalCents = 0;

  for (const item of items) {
    if (item.ventaStatus !== "COMPLETED") continue;

    totalesPorMoneda[item.precioMoneda] =
      (totalesPorMoneda[item.precioMoneda] ?? 0) + item.totalOriginalCents;

    if (item.totalNacionalCents != null) {
      totalNacionalCents += item.totalNacionalCents;
    } else {
      totalNacionalCents += item.totalOriginalCents;
    }
  }

  return { totalesPorMoneda, totalNacionalCents };
}

/**
 * Obtiene las ventas completadas en un rango de fechas que aún no
 * pertenecen a ningún corte.
 */
export function obtenerVentasSinCorte(
  fechaInicio: Date,
  fechaFin: Date,
): CorteVentaItem[] {
  const rows = db
    .select({
      venta,
      productoDescripcion: producto.descripcion,
      precioValorCents: precio.valorCents,
      precioMoneda: precio.moneda,
      tasaValorCents: tasaCambio.valorCents,
    })
    .from(venta)
    .innerJoin(producto, eq(venta.productoId, producto.id))
    .innerJoin(precio, eq(venta.precioId, precio.id))
    .leftJoin(tasaCambio, eq(venta.tasaCambioId, tasaCambio.id))
    .where(
      and(
        eq(venta.status, "COMPLETED"),
        isNull(venta.corteVentaId),
        between(venta.createdAt, fechaInicio, fechaFin),
      ),
    )
    .orderBy(desc(venta.createdAt))
    .all();

  return buildVentaItems(rows);
}

/* ------------------------------------------------------------------ */
/* Comandos                                                            */
/* ------------------------------------------------------------------ */

/**
 * Crea un corte de ventas para un período.
 *
 * TRANSACCIÓN:
 * 1. Encuentra todas las ventas COMPLETED en el rango que no tienen corte.
 * 2. Crea el registro corte_venta.
 * 3. Asigna corte_venta_id a esas ventas.
 *
 * Lanza error si no hay ventas en el período.
 */
export function crearCorte(
  fechaInicio: Date,
  fechaFin: Date,
  notas?: string,
): CorteDetalle {
  if (fechaFin < fechaInicio) {
    throw new Error("La fecha fin debe ser igual o posterior a la fecha inicio");
  }

  const crear = sqlite.transaction(() => {
    // 1. Ventas elegibles
    const ventasElegibles = db
      .select({ id: venta.id })
      .from(venta)
      .where(
        and(
          eq(venta.status, "COMPLETED"),
          isNull(venta.corteVentaId),
          between(venta.createdAt, fechaInicio, fechaFin),
        ),
      )
      .all();

    if (ventasElegibles.length === 0) {
      throw new Error(
        "No hay ventas completadas sin corte en el período seleccionado",
      );
    }

    // 2. Crear corte
    const corte = db
      .insert(corteVenta)
      .values({
        fechaInicio,
        fechaFin,
        notas: notas?.trim() || null,
        status: "CLOSED",
      })
      .returning()
      .get();

    // 3. Asignar ventas al corte
    const ventaIds = ventasElegibles.map((v) => v.id);
    for (const vid of ventaIds) {
      db.update(venta)
        .set({ corteVentaId: corte.id })
        .where(eq(venta.id, vid))
        .run();
    }

    return corte;
  });

  const corte = crear();
  return obtenerCorteDetalle(corte.id)!;
}

/**
 * Lista todos los cortes con resumen.
 */
export function listarCortes(): CorteResumen[] {
  const cortes = db
    .select()
    .from(corteVenta)
    .orderBy(desc(corteVenta.createdAt))
    .all();

  return cortes.map((c) => {
    const items = obtenerVentasDeCorte(c.id);
    const completadas = items.filter((i) => i.ventaStatus === "COMPLETED");
    const { totalNacionalCents } = calcTotales(items);

    return {
      corte: c,
      ventasCount: completadas.length,
      totalNacionalCents,
    };
  });
}

/**
 * Obtiene el detalle completo de un corte.
 */
export function obtenerCorteDetalle(
  corteId: number,
): CorteDetalle | undefined {
  const corte = db
    .select()
    .from(corteVenta)
    .where(eq(corteVenta.id, corteId))
    .get();

  if (!corte) return undefined;

  const items = obtenerVentasDeCorte(corteId);
  const completadas = items.filter((i) => i.ventaStatus === "COMPLETED");
  const { totalesPorMoneda, totalNacionalCents } = calcTotales(items);

  return {
    corte,
    ventasCount: completadas.length,
    totalesPorMoneda,
    totalNacionalCents,
    ventas: items,
  };
}

function obtenerVentasDeCorte(corteId: number): CorteVentaItem[] {
  const rows = db
    .select({
      venta,
      productoDescripcion: producto.descripcion,
      precioValorCents: precio.valorCents,
      precioMoneda: precio.moneda,
      tasaValorCents: tasaCambio.valorCents,
    })
    .from(venta)
    .innerJoin(producto, eq(venta.productoId, producto.id))
    .innerJoin(precio, eq(venta.precioId, precio.id))
    .leftJoin(tasaCambio, eq(venta.tasaCambioId, tasaCambio.id))
    .where(eq(venta.corteVentaId, corteId))
    .orderBy(desc(venta.createdAt))
    .all();

  return buildVentaItems(rows);
}

/**
 * Obtiene ventas filtradas por período (para exportación, sin crear corte).
 */
export function obtenerVentasPorPeriodo(
  fechaInicio: Date,
  fechaFin: Date,
): CorteVentaItem[] {
  const rows = db
    .select({
      venta,
      productoDescripcion: producto.descripcion,
      precioValorCents: precio.valorCents,
      precioMoneda: precio.moneda,
      tasaValorCents: tasaCambio.valorCents,
    })
    .from(venta)
    .innerJoin(producto, eq(venta.productoId, producto.id))
    .innerJoin(precio, eq(venta.precioId, precio.id))
    .leftJoin(tasaCambio, eq(venta.tasaCambioId, tasaCambio.id))
    .where(between(venta.createdAt, fechaInicio, fechaFin))
    .orderBy(desc(venta.createdAt))
    .all();

  return buildVentaItems(rows);
}

/**
 * Obtiene todas las ventas (para exportación full).
 */
export function obtenerTodasLasVentas(): CorteVentaItem[] {
  const rows = db
    .select({
      venta,
      productoDescripcion: producto.descripcion,
      precioValorCents: precio.valorCents,
      precioMoneda: precio.moneda,
      tasaValorCents: tasaCambio.valorCents,
    })
    .from(venta)
    .innerJoin(producto, eq(venta.productoId, producto.id))
    .innerJoin(precio, eq(venta.precioId, precio.id))
    .leftJoin(tasaCambio, eq(venta.tasaCambioId, tasaCambio.id))
    .orderBy(desc(venta.createdAt))
    .all();

  return buildVentaItems(rows);
}
