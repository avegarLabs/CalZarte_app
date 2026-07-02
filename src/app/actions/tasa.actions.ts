"use server";

import { revalidatePath } from "next/cache";

import type { Moneda } from "@/db/constants";
import {
  fijarTasa,
  actualizarTasa,
  eliminarTasa,
} from "@/services/tasa-cambio.service";

type Result<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function fijarTasaAction(formData: FormData): Promise<Result> {
  try {
    const moneda = formData.get("moneda") as Moneda;
    const valor = Number(formData.get("valor"));
    const valorCents = Math.round(valor * 100);

    if (isNaN(valorCents) || valorCents <= 0) {
      return { success: false, error: "La tasa debe ser mayor que 0" };
    }

    fijarTasa(moneda, valorCents);

    revalidatePath("/tasas");
    revalidatePath("/ventas");
    revalidatePath("/productos");
    return { success: true, data: undefined };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function actualizarTasaAction(
  id: number,
  formData: FormData,
): Promise<Result> {
  try {
    const valor = Number(formData.get("valor"));
    const valorCents = Math.round(valor * 100);

    if (isNaN(valorCents) || valorCents <= 0) {
      return { success: false, error: "La tasa debe ser mayor que 0" };
    }

    actualizarTasa(id, valorCents);

    revalidatePath("/tasas");
    revalidatePath("/ventas");
    revalidatePath("/productos");
    return { success: true, data: undefined };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function eliminarTasaAction(id: number): Promise<Result> {
  try {
    eliminarTasa(id);

    revalidatePath("/tasas");
    revalidatePath("/ventas");
    revalidatePath("/productos");
    return { success: true, data: undefined };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}
