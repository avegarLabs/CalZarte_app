"use server";

import { revalidatePath } from "next/cache";

import type { Moneda } from "@/db/constants";
import { cambiarPrecio } from "@/services/precio.service";

type Result<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function cambiarPrecioAction(
  productoId: number,
  formData: FormData,
): Promise<Result> {
  try {
    const valor = Number(formData.get("precio"));
    const moneda = formData.get("moneda") as Moneda;
    const valorCents = Math.round(valor * 100);

    if (isNaN(valorCents) || valorCents <= 0) {
      return { success: false, error: "El precio debe ser mayor que 0" };
    }

    cambiarPrecio(productoId, valorCents, moneda);

    revalidatePath("/productos");
    revalidatePath("/ventas");
    return { success: true, data: undefined };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}
