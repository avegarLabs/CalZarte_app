import { and, desc, eq } from "drizzle-orm";

import { db, sqlite } from "@/db/connection";
import { type Moneda, MONEDA_NACIONAL } from "@/db/constants";
import { tasaCambio, venta, type TasaCambio } from "@/db/schema";

/**
 * Obtiene la tasa de cambio activa para una moneda extranjera.
 */
export function obtenerTasaActiva(
  moneda: Moneda,
): TasaCambio | undefined {
  return db
    .select()
    .from(tasaCambio)
    .where(
      and(eq(tasaCambio.moneda, moneda), eq(tasaCambio.status, "ACTIVE")),
    )
    .get();
}

/**
 * Obtiene todas las tasas activas (una por moneda extranjera).
 */
export function obtenerTasasActivas(): TasaCambio[] {
  return db
    .select()
    .from(tasaCambio)
    .where(eq(tasaCambio.status, "ACTIVE"))
    .all();
}

/**
 * Historial de tasas para una moneda (más reciente primero).
 */
export function obtenerHistorialTasas(moneda: Moneda): TasaCambio[] {
  return db
    .select()
    .from(tasaCambio)
    .where(eq(tasaCambio.moneda, moneda))
    .orderBy(desc(tasaCambio.createdAt))
    .all();
}

/**
 * Fija una nueva tasa de cambio para una moneda.
 *
 * Dentro de una TRANSACCIÓN:
 * 1. Desactiva la tasa activa anterior (si existe).
 * 2. Inserta la nueva tasa como ACTIVE.
 *
 * No se puede fijar tasa para la moneda nacional (no tiene sentido
 * convertir CUP a CUP).
 */
export function fijarTasa(
  moneda: Moneda,
  valorCents: number,
): TasaCambio {
  if (moneda === MONEDA_NACIONAL) {
    throw new Error(
      `No se puede fijar tasa de cambio para la moneda nacional (${MONEDA_NACIONAL})`,
    );
  }
  if (valorCents <= 0) {
    throw new Error("El valor de la tasa debe ser positivo");
  }

  const fijar = sqlite.transaction(() => {
    // Desactivar tasa actual de esta moneda.
    db.update(tasaCambio)
      .set({ status: "INACTIVE" })
      .where(
        and(eq(tasaCambio.moneda, moneda), eq(tasaCambio.status, "ACTIVE")),
      )
      .run();

    // Insertar nueva tasa activa.
    return db
      .insert(tasaCambio)
      .values({ moneda, valorCents, status: "ACTIVE" })
      .returning()
      .get();
  });

  return fijar();
}

/**
 * Obtiene una tasa por ID.
 */
export function obtenerTasaPorId(id: number): TasaCambio | undefined {
  return db.select().from(tasaCambio).where(eq(tasaCambio.id, id)).get();
}

/**
 * Obtiene todas las tasas (activas e inactivas), ordenadas por fecha desc.
 */
export function obtenerTodasLasTasas(): TasaCambio[] {
  return db
    .select()
    .from(tasaCambio)
    .orderBy(desc(tasaCambio.createdAt))
    .all();
}

/**
 * Actualiza el valor de una tasa de cambio.
 * Solo se permite editar tasas ACTIVE.
 *
 * TRANSACCIÓN: desactiva la tasa actual y crea una nueva con el nuevo valor.
 * Esto preserva el snapshot para ventas anteriores que referencian la tasa vieja.
 */
export function actualizarTasa(
  id: number,
  valorCents: number,
): TasaCambio {
  if (valorCents <= 0) {
    throw new Error("El valor de la tasa debe ser positivo");
  }

  const existente = db
    .select()
    .from(tasaCambio)
    .where(eq(tasaCambio.id, id))
    .get();

  if (!existente) {
    throw new Error(`Tasa con id ${id} no encontrada`);
  }
  if (existente.status !== "ACTIVE") {
    throw new Error("Solo se pueden editar tasas activas");
  }

  const actualizar = sqlite.transaction(() => {
    db.update(tasaCambio)
      .set({ status: "INACTIVE" })
      .where(eq(tasaCambio.id, id))
      .run();

    return db
      .insert(tasaCambio)
      .values({
        moneda: existente.moneda,
        valorCents,
        status: "ACTIVE",
      })
      .returning()
      .get();
  });

  return actualizar();
}

/**
 * Elimina una tasa de cambio.
 * No se puede eliminar si está referenciada por alguna venta (FK restrict).
 */
export function eliminarTasa(id: number): void {
  const existente = db
    .select()
    .from(tasaCambio)
    .where(eq(tasaCambio.id, id))
    .get();

  if (!existente) {
    throw new Error(`Tasa con id ${id} no encontrada`);
  }

  const ventasConTasa = db
    .select({ id: venta.id })
    .from(venta)
    .where(eq(venta.tasaCambioId, id))
    .limit(1)
    .all();

  if (ventasConTasa.length > 0) {
    throw new Error(
      `No se puede eliminar: la tasa está referenciada por ventas existentes`,
    );
  }

  db.delete(tasaCambio).where(eq(tasaCambio.id, id)).run();
}
