import type { Moneda } from "@/db/constants";

export interface Denominacion {
  valorCents: number;
  label: string;
}

export const DENOMINACIONES: Record<Moneda, Denominacion[]> = {
  CUP: [
    { valorCents: 100_000, label: "$1,000" },
    { valorCents: 50_000, label: "$500" },
    { valorCents: 20_000, label: "$200" },
    { valorCents: 10_000, label: "$100" },
    { valorCents: 5_000, label: "$50" },
    { valorCents: 2_000, label: "$20" },
    { valorCents: 1_000, label: "$10" },
    { valorCents: 500, label: "$5" },
    { valorCents: 300, label: "$3" },
    { valorCents: 100, label: "$1" },
  ],
  USD: [
    { valorCents: 10_000, label: "$100" },
    { valorCents: 5_000, label: "$50" },
    { valorCents: 2_000, label: "$20" },
    { valorCents: 1_000, label: "$10" },
    { valorCents: 500, label: "$5" },
    { valorCents: 100, label: "$1" },
  ],
  EUR: [
    { valorCents: 50_000, label: "€500" },
    { valorCents: 20_000, label: "€200" },
    { valorCents: 10_000, label: "€100" },
    { valorCents: 5_000, label: "€50" },
    { valorCents: 2_000, label: "€20" },
    { valorCents: 1_000, label: "€10" },
    { valorCents: 500, label: "€5" },
    { valorCents: 200, label: "€2" },
    { valorCents: 100, label: "€1" },
  ],
};

export const MONEDAS_LABEL: Record<Moneda, string> = {
  CUP: "Pesos Cubanos (CUP)",
  USD: "Dólares (USD)",
  EUR: "Euros (EUR)",
};
