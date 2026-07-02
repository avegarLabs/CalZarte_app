"use server";

import { revalidatePath } from "next/cache";

import type { Moneda } from "@/db/constants";
import {
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "@/services/producto.service";
import { cambiarPrecio } from "@/services/precio.service";

type Result<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function crearProductoAction(
  formData: FormData,
): Promise<Result> {
  try {
    const descripcion = formData.get("descripcion") as string;
    const cantidad = Number(formData.get("cantidad"));
    const valorCents = Math.round(Number(formData.get("precio")) * 100);
    const moneda = formData.get("moneda") as Moneda;

    if (!descripcion?.trim()) {
      return { success: false, error: "La descripcion es obligatoria" };
    }
    if (isNaN(cantidad) || cantidad < 0) {
      return { success: false, error: "La cantidad debe ser >= 0" };
    }
    if (isNaN(valorCents) || valorCents <= 0) {
      return { success: false, error: "El precio debe ser mayor que 0" };
    }

    const prod = crearProducto({ descripcion: descripcion.trim(), cantidad });
    cambiarPrecio(prod.id, valorCents, moneda);

    revalidatePath("/productos");
    revalidatePath("/ventas");
    return { success: true, data: undefined };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function actualizarProductoAction(
  id: number,
  formData: FormData,
): Promise<Result> {
  try {
    const descripcion = formData.get("descripcion") as string;
    const cantidad = Number(formData.get("cantidad"));

    if (!descripcion?.trim()) {
      return { success: false, error: "La descripcion es obligatoria" };
    }

    actualizarProducto(id, {
      descripcion: descripcion.trim(),
      cantidad: isNaN(cantidad) ? undefined : cantidad,
    });

    revalidatePath("/productos");
    revalidatePath("/ventas");
    return { success: true, data: undefined };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}

export async function eliminarProductoAction(id: number): Promise<Result> {
  try {
    eliminarProducto(id);
    revalidatePath("/productos");
    return { success: true, data: undefined };
  } catch (e: unknown) {
    return { success: false, error: (e as Error).message };
  }
}
