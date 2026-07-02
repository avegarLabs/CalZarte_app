"use server";

import { revalidatePath } from "next/cache";

import { registrarVenta, cancelarVenta } from "@/services/venta.service";

type Result<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function registrarVentaAction(
  formData: FormData,
): Promise<Result> {
  try {
    const productoId = Number(formData.get("productoId"));
    const cantidad = Number(formData.get("cantidad"));

    if (isNaN(productoId) || productoId <= 0) {
      return { success: false, error: "Seleccione un producto" };
    }
    if (isNaN(cantidad) || cantidad <= 0) {
      return { success: false, error: "La cantidad debe ser mayor que 0" };
    }

    registrarVenta(productoId, cantidad);

    revalidatePath("/ventas");
    revalidatePath("/productos");
    return { success: true, data: undefined };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function cancelarVentaAction(ventaId: number): Promise<Result> {
  try {
    cancelarVenta(ventaId);

    revalidatePath("/ventas");
    revalidatePath("/productos");
    return { success: true, data: undefined };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}
