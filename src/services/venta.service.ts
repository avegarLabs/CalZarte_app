import { and, desc, eq, sql } from "drizzle-orm";

import { db, sqlite } from "@/db/connection";
import { MONEDA_NACIONAL, type Moneda } from "@/db/constants";
import {
  precio,
  producto,
  tasaCambio,
  venta,
  type Precio,
  type TasaCambio,
  type Venta,
} from "@/db/schema";
import { convertToNationalCents } from "@/lib/money";

/* ------------------------------------------------------------------ */
/* Tipos públicos                                                      */
/* ------------------------------------------------------------------ */

/** Resultado enriquecido de registrar una venta. */
export interface VentaRegistrada {
  venta: Venta;
  precioSnapshot: Precio;
  tasaSnapshot: TasaCambio | null;
  /** Total en la moneda del precio (centavos). */
  totalOriginalCents: number;
  /** Total convertido a moneda nacional (centavos). null si ya era nacional. */
  totalNacionalCents: number | null;
}

/** Venta con datos expandidos para listados. */
export interface VentaDetallada {
  venta: Venta;
  productoDescripcion: string;
  precioValorCents: number;
  precioMoneda: string;
  tasaValorCents: number | null;
  totalOriginalCents: number;
  totalNacionalCents: number | null;
}

/* ------------------------------------------------------------------ */
/* Operaciones                                                         */
/* ------------------------------------------------------------------ */

/**
 * Registra una venta.
 *
 * TRANSACCIÓN:
 * 1. Valida existencia del producto.
 * 2. Obtiene precio activo (error si no existe).
 * 3. Si el precio es en moneda extranjera, obtiene tasa activa (error si no existe).
 * 4. Valida stock suficiente.
 * 5. Descuenta stock.
 * 6. Inserta la venta con snapshot (precio_id, tasa_cambio_id).
 */
export function registrarVenta(
  productoId: number,
  cantidad: number,
): VentaRegistrada {
  if (cantidad <= 0) {
    throw new Error("La cantidad debe ser mayor que 0");
  }

  const registrar = sqlite.transaction(() => {
    // 1. Producto
    const prod = db
      .select()
      .from(producto)
      .where(eq(producto.id, productoId))
      .get();

    if (!prod) {
      throw new Error(`Producto con id ${productoId} no encontrado`);
    }

    // 2. Precio activo
    const precioActivo = db
      .select()
      .from(precio)
      .where(
        and(eq(precio.productoId, productoId), eq(precio.status, "ACTIVE")),
      )
      .get();

    if (!precioActivo) {
      throw new Error(
        `El producto "${prod.descripcion}" no tiene un precio activo`,
      );
    }

    // 3. Tasa (si aplica)
    let tasaActiva: TasaCambio | null = null;
    const moneda = precioActivo.moneda as Moneda;

    if (moneda !== MONEDA_NACIONAL) {
      const tasa = db
        .select()
        .from(tasaCambio)
        .where(
          and(
            eq(tasaCambio.moneda, moneda),
            eq(tasaCambio.status, "ACTIVE"),
          ),
        )
        .get();

      if (!tasa) {
        throw new Error(
          `No hay tasa de cambio activa para ${moneda}. No se puede registrar la venta.`,
        );
      }
      tasaActiva = tasa;
    }

    // 4. Stock
    if (prod.cantidad < cantidad) {
      throw new Error(
        `Stock insuficiente para "${prod.descripcion}": disponible ${prod.cantidad}, solicitado ${cantidad}`,
      );
    }

    // 5. Descontar stock
    db.update(producto)
      .set({ cantidad: sql`${producto.cantidad} - ${cantidad}` })
      .where(eq(producto.id, productoId))
      .run();

    // 6. Insertar venta con snapshot
    const nuevaVenta = db
      .insert(venta)
      .values({
        productoId,
        cantidad,
        precioId: precioActivo.id,
        tasaCambioId: tasaActiva?.id ?? null,
        status: "COMPLETED",
      })
      .returning()
      .get();

    // Cálculos
    const totalOriginalCents = precioActivo.valorCents * cantidad;
    const totalNacionalCents = tasaActiva
      ? convertToNationalCents(totalOriginalCents, tasaActiva.valorCents)
      : null;

    return {
      venta: nuevaVenta,
      precioSnapshot: precioActivo,
      tasaSnapshot: tasaActiva,
      totalOriginalCents,
      totalNacionalCents,
    } satisfies VentaRegistrada;
  });

  return registrar();
}

/**
 * Lista las ventas con datos expandidos (producto, precio, tasa).
 */
export function listarVentas(): VentaDetallada[] {
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

  return rows.map((r) => {
    const totalOriginalCents = r.precioValorCents * r.venta.cantidad;
    const totalNacionalCents =
      r.tasaValorCents != null
        ? convertToNationalCents(totalOriginalCents, r.tasaValorCents)
        : null;

    return {
      venta: r.venta,
      productoDescripcion: r.productoDescripcion,
      precioValorCents: r.precioValorCents,
      precioMoneda: r.precioMoneda,
      tasaValorCents: r.tasaValorCents,
      totalOriginalCents,
      totalNacionalCents,
    };
  });
}

/**
 * Cancela una venta: marca status CANCELLED y devuelve stock.
 */
export function cancelarVenta(ventaId: number): Venta {
  const cancelar = sqlite.transaction(() => {
    const v = db
      .select()
      .from(venta)
      .where(eq(venta.id, ventaId))
      .get();

    if (!v) {
      throw new Error(`Venta con id ${ventaId} no encontrada`);
    }
    if (v.status === "CANCELLED") {
      throw new Error(`La venta ${ventaId} ya está cancelada`);
    }

    // Devolver stock
    db.update(producto)
      .set({ cantidad: sql`${producto.cantidad} + ${v.cantidad}` })
      .where(eq(producto.id, v.productoId))
      .run();

    // Marcar cancelada
    return db
      .update(venta)
      .set({ status: "CANCELLED" })
      .where(eq(venta.id, ventaId))
      .returning()
      .get();
  });

  return cancelar()!;
}
