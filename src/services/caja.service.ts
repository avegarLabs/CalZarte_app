import { desc, eq } from "drizzle-orm";

import { db, sqlite } from "@/db/connection";
import { MONEDA_NACIONAL, type Moneda } from "@/db/constants";
import { caja, cajaDetalle, type Caja, type CajaDetalle } from "@/db/schema";
import { convertToNationalCents, fromCents } from "@/lib/money";
import { obtenerTasaActiva } from "./tasa-cambio.service";

export interface DetalleInput {
  moneda: string;
  denominacionCents: number;
  cantidad: number;
}

export interface CajaResumen {
  caja: Caja;
  totalesPorMoneda: Record<string, number>;
  totalCupCents: number;
}

export interface CajaCompleta {
  caja: Caja;
  detalles: CajaDetalle[];
  totalesPorMoneda: Record<string, number>;
  totalCupCents: number;
  tasasUsadas: Record<string, number>;
}

function calcularTotales(detalles: CajaDetalle[]) {
  const totalesPorMoneda: Record<string, number> = {};
  let totalCupCents = 0;
  const tasasUsadas: Record<string, number> = {};

  for (const d of detalles) {
    const subtotal = d.denominacionCents * d.cantidad;
    totalesPorMoneda[d.moneda] = (totalesPorMoneda[d.moneda] ?? 0) + subtotal;
  }

  for (const [moneda, totalCents] of Object.entries(totalesPorMoneda)) {
    if (moneda === MONEDA_NACIONAL) {
      totalCupCents += totalCents;
    } else {
      const tasa = obtenerTasaActiva(moneda as Moneda);
      if (tasa) {
        tasasUsadas[moneda] = tasa.valorCents;
        totalCupCents += convertToNationalCents(totalCents, tasa.valorCents);
      }
    }
  }

  return { totalesPorMoneda, totalCupCents, tasasUsadas };
}

export function crearArqueo(
  detalles: DetalleInput[],
  notas?: string,
): CajaCompleta {
  const detsFiltrados = detalles.filter((d) => d.cantidad > 0);
  if (detsFiltrados.length === 0) {
    throw new Error("Debe ingresar al menos una denominación con cantidad mayor a 0");
  }

  const crear = sqlite.transaction(() => {
    db.update(caja)
      .set({ status: "CLOSED" })
      .where(eq(caja.status, "OPEN"))
      .run();

    const nuevaCaja = db
      .insert(caja)
      .values({
        fecha: new Date(),
        notas: notas?.trim() || null,
        status: "OPEN",
      })
      .returning()
      .get();

    for (const d of detsFiltrados) {
      db.insert(cajaDetalle)
        .values({
          cajaId: nuevaCaja.id,
          moneda: d.moneda,
          denominacionCents: d.denominacionCents,
          cantidad: d.cantidad,
        })
        .run();
    }

    return nuevaCaja;
  });

  const nuevaCaja = crear();
  return obtenerCajaCompleta(nuevaCaja.id)!;
}

export function listarArqueos(): CajaResumen[] {
  const cajas = db
    .select()
    .from(caja)
    .orderBy(desc(caja.createdAt))
    .all();

  return cajas.map((c) => {
    const detalles = db
      .select()
      .from(cajaDetalle)
      .where(eq(cajaDetalle.cajaId, c.id))
      .all();

    const { totalesPorMoneda, totalCupCents } = calcularTotales(detalles);

    return { caja: c, totalesPorMoneda, totalCupCents };
  });
}

export function obtenerCajaCompleta(
  cajaId: number,
): CajaCompleta | undefined {
  const c = db.select().from(caja).where(eq(caja.id, cajaId)).get();
  if (!c) return undefined;

  const detalles = db
    .select()
    .from(cajaDetalle)
    .where(eq(cajaDetalle.cajaId, cajaId))
    .all();

  const { totalesPorMoneda, totalCupCents, tasasUsadas } =
    calcularTotales(detalles);

  return { caja: c, detalles, totalesPorMoneda, totalCupCents, tasasUsadas };
}

export function obtenerCajaAbierta(): CajaCompleta | undefined {
  const c = db
    .select()
    .from(caja)
    .where(eq(caja.status, "OPEN"))
    .get();

  if (!c) return undefined;
  return obtenerCajaCompleta(c.id);
}
