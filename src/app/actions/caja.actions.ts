"use server";

import { revalidatePath } from "next/cache";

import { crearArqueo, type DetalleInput } from "@/services/caja.service";

type Result<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function crearArqueoAction(
  formData: FormData,
): Promise<Result> {
  try {
    const cantidadesJson = formData.get("cantidades") as string;
    const notas = formData.get("notas") as string;

    if (!cantidadesJson) {
      return { success: false, error: "Datos de denominaciones requeridos" };
    }

    const cantidades: Record<string, Record<string, number>> =
      JSON.parse(cantidadesJson);

    const detalles: DetalleInput[] = [];
    for (const [moneda, denoms] of Object.entries(cantidades)) {
      for (const [denomCentsStr, cantidad] of Object.entries(denoms)) {
        const cant = Number(cantidad);
        if (cant > 0) {
          detalles.push({
            moneda,
            denominacionCents: Number(denomCentsStr),
            cantidad: cant,
          });
        }
      }
    }

    crearArqueo(detalles, notas);

    revalidatePath("/caja");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}
