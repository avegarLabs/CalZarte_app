import { sql } from "drizzle-orm";
import {
  check,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  CAJA_STATUS,
  CORTE_STATUS,
  MONEDAS,
  PRECIO_STATUS,
  TASA_STATUS,
  VENTA_STATUS,
} from "./constants";

/** Lista de valores -> fragmento SQL `'a','b','c'` para un CHECK IN (...) */
const inList = (values: readonly string[]) =>
  sql.raw(values.map((v) => `'${v}'`).join(", "));

/** Columnas de auditoría comunes (segundos epoch). */
const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
};

/* ------------------------------------------------------------------ */
/* Producto                                                            */
/* ------------------------------------------------------------------ */
export const producto = sqliteTable(
  "producto",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    descripcion: text("descripcion").notNull(),
    /** Stock disponible. */
    cantidad: integer("cantidad").notNull().default(0),
    ...timestamps,
  },
  (t) => [check("producto_cantidad_no_negativa", sql`${t.cantidad} >= 0`)],
);

/* ------------------------------------------------------------------ */
/* Precio  (1 Producto : M Precios, un único ACTIVE)                  */
/* ------------------------------------------------------------------ */
export const precio = sqliteTable(
  "precio",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productoId: integer("producto_id")
      .notNull()
      .references(() => producto.id, { onDelete: "cascade" }),
    /** Valor en centavos de la moneda indicada. */
    valorCents: integer("valor_cents").notNull(),
    moneda: text("moneda").notNull(),
    status: text("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (t) => [
    // Garantiza un solo precio ACTIVE por producto (índice único parcial).
    uniqueIndex("precio_activo_unico_por_producto")
      .on(t.productoId)
      .where(sql`${t.status} = 'ACTIVE'`),
    check("precio_valor_positivo", sql`${t.valorCents} > 0`),
    check("precio_moneda_valida", sql`${t.moneda} IN (${inList(MONEDAS)})`),
    check("precio_status_valido", sql`${t.status} IN (${inList(PRECIO_STATUS)})`),
  ],
);

/* ------------------------------------------------------------------ */
/* Tasa_Cambio  (una única ACTIVE por moneda)                         */
/* ------------------------------------------------------------------ */
export const tasaCambio = sqliteTable(
  "tasa_cambio",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    /** Moneda extranjera que se convierte a la moneda nacional. */
    moneda: text("moneda").notNull(),
    /** Cuántos centavos de moneda nacional equivale 1 unidad de `moneda`. */
    valorCents: integer("valor_cents").notNull(),
    status: text("status").notNull().default("ACTIVE"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("tasa_activa_unica_por_moneda")
      .on(t.moneda)
      .where(sql`${t.status} = 'ACTIVE'`),
    check("tasa_valor_positivo", sql`${t.valorCents} > 0`),
    check("tasa_moneda_valida", sql`${t.moneda} IN (${inList(MONEDAS)})`),
    check("tasa_status_valido", sql`${t.status} IN (${inList(TASA_STATUS)})`),
  ],
);

/* ------------------------------------------------------------------ */
/* Corte de Ventas  (cierre/snapshot de un período)                   */
/* ------------------------------------------------------------------ */
export const corteVenta = sqliteTable(
  "corte_venta",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fechaInicio: integer("fecha_inicio", { mode: "timestamp" }).notNull(),
    fechaFin: integer("fecha_fin", { mode: "timestamp" }).notNull(),
    notas: text("notas"),
    status: text("status").notNull().default("CLOSED"),
    ...timestamps,
  },
  (t) => [
    check("corte_fechas_validas", sql`${t.fechaFin} >= ${t.fechaInicio}`),
    check(
      "corte_status_valido",
      sql`${t.status} IN (${inList(CORTE_STATUS)})`,
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Venta  (snapshot de precio y tasa al momento de la operación)      */
/* ------------------------------------------------------------------ */
export const venta = sqliteTable(
  "venta",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productoId: integer("producto_id")
      .notNull()
      .references(() => producto.id, { onDelete: "restrict" }),
    cantidad: integer("cantidad").notNull(),
    /** Precio usado en la venta (snapshot por FK -> trazabilidad). */
    precioId: integer("precio_id")
      .notNull()
      .references(() => precio.id, { onDelete: "restrict" }),
    /** Tasa usada si el precio era en moneda extranjera; null si fue nacional. */
    tasaCambioId: integer("tasa_cambio_id").references(() => tasaCambio.id, {
      onDelete: "restrict",
    }),
    /** Corte al que pertenece esta venta; null si no ha sido cortada. */
    corteVentaId: integer("corte_venta_id").references(() => corteVenta.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("COMPLETED"),
    ...timestamps,
  },
  (t) => [
    check("venta_cantidad_positiva", sql`${t.cantidad} > 0`),
    check("venta_status_valido", sql`${t.status} IN (${inList(VENTA_STATUS)})`),
  ],
);

/* ------------------------------------------------------------------ */
/* Caja  (arqueo — conteo de efectivo por denominación)               */
/* ------------------------------------------------------------------ */
export const caja = sqliteTable(
  "caja",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fecha: integer("fecha", { mode: "timestamp" }).notNull(),
    notas: text("notas"),
    status: text("status").notNull().default("OPEN"),
    ...timestamps,
  },
  (t) => [
    check(
      "caja_status_valido",
      sql`${t.status} IN (${inList(CAJA_STATUS)})`,
    ),
  ],
);

export const cajaDetalle = sqliteTable(
  "caja_detalle",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    cajaId: integer("caja_id")
      .notNull()
      .references(() => caja.id, { onDelete: "cascade" }),
    moneda: text("moneda").notNull(),
    denominacionCents: integer("denominacion_cents").notNull(),
    cantidad: integer("cantidad").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    check("detalle_cantidad_no_negativa", sql`${t.cantidad} >= 0`),
    check("detalle_denominacion_positiva", sql`${t.denominacionCents} > 0`),
    check(
      "detalle_moneda_valida",
      sql`${t.moneda} IN (${inList(MONEDAS)})`,
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Tipos inferidos                                                    */
/* ------------------------------------------------------------------ */
export type Producto = typeof producto.$inferSelect;
export type NuevoProducto = typeof producto.$inferInsert;
export type Precio = typeof precio.$inferSelect;
export type NuevoPrecio = typeof precio.$inferInsert;
export type TasaCambio = typeof tasaCambio.$inferSelect;
export type NuevaTasaCambio = typeof tasaCambio.$inferInsert;
export type CorteVenta = typeof corteVenta.$inferSelect;
export type NuevoCorteVenta = typeof corteVenta.$inferInsert;
export type Venta = typeof venta.$inferSelect;
export type NuevaVenta = typeof venta.$inferInsert;
export type Caja = typeof caja.$inferSelect;
export type NuevaCaja = typeof caja.$inferInsert;
export type CajaDetalle = typeof cajaDetalle.$inferSelect;
export type NuevoCajaDetalle = typeof cajaDetalle.$inferInsert;
