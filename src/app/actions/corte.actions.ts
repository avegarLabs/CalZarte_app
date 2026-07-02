"use server";

import { revalidatePath } from "next/cache";

import { crearCorte } from "@/services/corte-venta.service";

type Result<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function crearCorteAction(
  formData: FormData,
): Promise<Result> {
  try {
    const desde = formData.get("desde") as string;
    const hasta = formData.get("hasta") as string;
    const notas = formData.get("notas") as string;

    if (!desde || !hasta) {
      return { success: false, error: "Las fechas son obligatorias" };
    }

    const fechaInicio = new Date(desde);
    const fechaFin = new Date(hasta + "T23:59:59");

    crearCorte(fechaInicio, fechaFin, notas);

    revalidatePath("/ventas");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}
