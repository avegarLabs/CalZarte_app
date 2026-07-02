import { db, sqlite } from "./connection";
import { precio, producto, tasaCambio, venta } from "./schema";
import { toCents } from "@/lib/money";

/**
 * Datos de ejemplo para PoC/MVP.
 * Demuestra multimoneda real: precios en USD, EUR y CUP, con tasas activas.
 */
function seed() {
  console.log("Sembrando datos de ejemplo...");

  // Limpieza (orden respetando FKs).
  db.delete(venta).run();
  db.delete(precio).run();
  db.delete(tasaCambio).run();
  db.delete(producto).run();

  // --- Tasas de cambio activas (CUP por 1 unidad extranjera) ---
  db.insert(tasaCambio)
    .values([
      { moneda: "USD", valorCents: toCents("420.00"), status: "ACTIVE" },
      { moneda: "EUR", valorCents: toCents("450.00"), status: "ACTIVE" },
      // histórica (inactiva) para demostrar trazabilidad
      { moneda: "USD", valorCents: toCents("400.00"), status: "INACTIVE" },
    ])
    .run();

  // --- Productos ---
  const productos = db
    .insert(producto)
    .values([
      { descripcion: "Tenis Running Pro 42", cantidad: 25 },
      { descripcion: "Botas Cuero Clasica 40", cantidad: 12 },
      { descripcion: "Sandalias Verano 38", cantidad: 40 },
    ])
    .returning()
    .all();

  const [tenis, botas, sandalias] = productos;

  // --- Precios (un único ACTIVE por producto) ---
  db.insert(precio)
    .values([
      // Tenis: precio actual USD + uno histórico inactivo
      {
        productoId: tenis.id,
        valorCents: toCents("45.00"),
        moneda: "USD",
        status: "ACTIVE",
      },
      {
        productoId: tenis.id,
        valorCents: toCents("40.00"),
        moneda: "USD",
        status: "INACTIVE",
      },
      // Botas: precio en EUR
      {
        productoId: botas.id,
        valorCents: toCents("80.00"),
        moneda: "EUR",
        status: "ACTIVE",
      },
      // Sandalias: precio directamente en moneda nacional
      {
        productoId: sandalias.id,
        valorCents: toCents("3500.00"),
        moneda: "CUP",
        status: "ACTIVE",
      },
    ])
    .run();

  const resumen = {
    productos: db.select().from(producto).all().length,
    precios: db.select().from(precio).all().length,
    tasas: db.select().from(tasaCambio).all().length,
  };
  console.log("Seed completado:", resumen);
}

seed();
sqlite.close();
