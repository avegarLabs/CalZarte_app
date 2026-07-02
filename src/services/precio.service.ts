import { and, desc, eq } from "drizzle-orm";

import { db, sqlite } from "@/db/connection";
import { type Moneda } from "@/db/constants";
import { precio, type Precio } from "@/db/schema";

/**
 * Obtiene el precio activo de un producto.
 * Retorna undefined si el producto no tiene precio activo.
 */
export function obtenerPrecioActivo(
  productoId: number,
): Precio | undefined {
  return db
    .select()
    .from(precio)
    .where(
      and(eq(precio.productoId, productoId), eq(precio.status, "ACTIVE")),
    )
    .get();
}

/**
 * Historial de precios de un producto (más reciente primero).
 */
export function obtenerHistorialPrecios(productoId: number): Precio[] {
  return db
    .select()
    .from(precio)
    .where(eq(precio.productoId, productoId))
    .orderBy(desc(precio.createdAt))
    .all();
}

/**
 * Cambia el precio de un producto.
 *
 * Dentro de una TRANSACCIÓN:
 * 1. Desactiva el precio activo actual (si existe).
 * 2. Inserta el nuevo precio como ACTIVE.
 *
 * El índice único parcial `precio_activo_unico_por_producto` garantiza
 * que nunca haya dos precios activos simultáneamente.
 */
export function cambiarPrecio(
  productoId: number,
  valorCents: number,
  moneda: Moneda,
): Precio {
  if (valorCents <= 0) {
    throw new Error("El valor del precio debe ser positivo");
  }

  const cambiar = sqlite.transaction(() => {
    // Desactivar precio actual (si existe).
    db.update(precio)
      .set({ status: "INACTIVE" })
      .where(
        and(eq(precio.productoId, productoId), eq(precio.status, "ACTIVE")),
      )
      .run();

    // Insertar nuevo precio activo.
    return db
      .insert(precio)
      .values({ productoId, valorCents, moneda, status: "ACTIVE" })
      .returning()
      .get();
  });

  return cambiar();
}
