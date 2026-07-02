import Decimal from "decimal.js";

import { MONEDA_NACIONAL, SUBUNIDADES_POR_UNIDAD } from "@/db/constants";

/**
 * Utilidades monetarias. Todo importe vive como entero de centavos.
 * decimal.js evita los errores de redondeo de los float.
 */

/** Convierte un importe en unidades ("12.50") a centavos enteros (1250). */
export function toCents(amount: number | string): number {
  return new Decimal(amount)
    .times(SUBUNIDADES_POR_UNIDAD)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
}

/** Convierte centavos (1250) a unidades como número (12.5). */
export function fromCents(cents: number): number {
  return new Decimal(cents).div(SUBUNIDADES_POR_UNIDAD).toNumber();
}

/**
 * Convierte un importe en moneda extranjera (centavos) a la moneda nacional
 * (centavos), aplicando la tasa.
 *
 * @param foreignCents  importe en centavos de la moneda extranjera
 * @param tasaCents     centavos de moneda nacional por 1 unidad extranjera
 */
export function convertToNationalCents(
  foreignCents: number,
  tasaCents: number,
): number {
  return new Decimal(foreignCents)
    .times(tasaCents)
    .div(SUBUNIDADES_POR_UNIDAD)
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
}

/** Formatea centavos para mostrar, p. ej. (1250, "USD") -> "12.50 USD". */
export function formatMoney(cents: number, moneda: string): string {
  return `${fromCents(cents).toFixed(2)} ${moneda}`;
}

/** ¿Es la moneda nacional? */
export function isNacional(moneda: string): boolean {
  return moneda === MONEDA_NACIONAL;
}
