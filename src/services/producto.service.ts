import { eq } from "drizzle-orm";

import { db } from "@/db/connection";
import { producto, type NuevoProducto, type Producto } from "@/db/schema";

export function obtenerProductos(): Producto[] {
  return db.select().from(producto).all();
}

export function obtenerProductoPorId(id: number): Producto | undefined {
  return db.select().from(producto).where(eq(producto.id, id)).get();
}

export function crearProducto(
  data: Pick<NuevoProducto, "descripcion" | "cantidad">,
): Producto {
  return db.insert(producto).values(data).returning().get();
}

export function actualizarProducto(
  id: number,
  data: Partial<Pick<NuevoProducto, "descripcion" | "cantidad">>,
): Producto {
  const actualizado = db
    .update(producto)
    .set(data)
    .where(eq(producto.id, id))
    .returning()
    .get();

  if (!actualizado) {
    throw new Error(`Producto con id ${id} no encontrado`);
  }
  return actualizado;
}

export function eliminarProducto(id: number): void {
  const result = db.delete(producto).where(eq(producto.id, id)).run();
  if (result.changes === 0) {
    throw new Error(`Producto con id ${id} no encontrado`);
  }
}
