import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { MONEDAS, PRECIO_STATUS, TASA_STATUS, VENTA_STATUS } from "./constants";
import { precio, producto, tasaCambio, venta } from "./schema";

/**
 * Esquemas Zod derivados del esquema Drizzle. Una sola fuente de verdad
 * para validar formularios y Server Actions.
 */

const monedaSchema = z.enum(MONEDAS);

export const productoInsertSchema = createInsertSchema(producto, {
  descripcion: (s) => s.min(1, "La descripción es obligatoria"),
  cantidad: (s) => s.int().nonnegative(),
});
export const productoSelectSchema = createSelectSchema(producto);

export const precioInsertSchema = createInsertSchema(precio, {
  valorCents: (s) => s.int().positive("El valor debe ser mayor que 0"),
  moneda: () => monedaSchema,
  status: () => z.enum(PRECIO_STATUS),
});
export const precioSelectSchema = createSelectSchema(precio);

export const tasaCambioInsertSchema = createInsertSchema(tasaCambio, {
  valorCents: (s) => s.int().positive("La tasa debe ser mayor que 0"),
  moneda: () => monedaSchema,
  status: () => z.enum(TASA_STATUS),
});
export const tasaCambioSelectSchema = createSelectSchema(tasaCambio);

export const ventaInsertSchema = createInsertSchema(venta, {
  cantidad: (s) => s.int().positive("La cantidad debe ser mayor que 0"),
  status: () => z.enum(VENTA_STATUS),
});
export const ventaSelectSchema = createSelectSchema(venta);
