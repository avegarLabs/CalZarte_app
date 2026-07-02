/**
 * Constantes de dominio CalZarte.
 *
 * Multimoneda real: el sistema opera con una moneda nacional (CUP) y una o
 * varias monedas extranjeras. La Tasa_Cambio expresa cuántas unidades de la
 * moneda nacional equivale 1 unidad de una moneda extranjera.
 */

/** Moneda nacional contra la que se convierte todo. */
export const MONEDA_NACIONAL = "CUP" as const;

/** Catálogo de monedas soportadas (extensible: multimoneda real). */
export const MONEDAS = ["CUP", "USD", "EUR"] as const;
export type Moneda = (typeof MONEDAS)[number];

/** Estados de un Precio. Solo uno puede estar ACTIVE por producto. */
export const PRECIO_STATUS = ["ACTIVE", "INACTIVE"] as const;
export type PrecioStatus = (typeof PRECIO_STATUS)[number];

/** Estados de una Tasa_Cambio. Solo una puede estar ACTIVE por moneda. */
export const TASA_STATUS = ["ACTIVE", "INACTIVE"] as const;
export type TasaStatus = (typeof TASA_STATUS)[number];

/** Estados de una Venta. */
export const VENTA_STATUS = ["COMPLETED", "CANCELLED"] as const;
export type VentaStatus = (typeof VENTA_STATUS)[number];

/** Estados de un Corte de Ventas. */
export const CORTE_STATUS = ["OPEN", "CLOSED"] as const;
export type CorteStatus = (typeof CORTE_STATUS)[number];

/** Estados de un Arqueo de Caja. */
export const CAJA_STATUS = ["OPEN", "CLOSED"] as const;
export type CajaStatus = (typeof CAJA_STATUS)[number];

/**
 * Todos los importes monetarios se almacenan como ENTEROS en la mínima
 * subunidad (centavos). Nunca usar float para dinero.
 */
export const SUBUNIDADES_POR_UNIDAD = 100;
