import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

import { MONEDA_NACIONAL } from "@/db/constants";
import {
  obtenerTodasLasVentas,
  obtenerVentasPorPeriodo,
} from "@/services/corte-venta.service";
import { EXPORT_COLUMNS, toExportRows } from "@/lib/export-data";
import { fromCents } from "@/lib/money";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  const items =
    desde && hasta
      ? obtenerVentasPorPeriodo(new Date(desde), new Date(hasta))
      : obtenerTodasLasVentas();

  const rows = toExportRows(items);

  const wb = new ExcelJS.Workbook();
  wb.creator = "CalZarte";
  wb.created = new Date();

  const ws = wb.addWorksheet("Ventas");

  // Header de título
  const periodoLabel =
    desde && hasta ? `${desde} a ${hasta}` : "Todas las ventas";
  ws.mergeCells("A1:J1");
  const titleCell = ws.getCell("A1");
  titleCell.value = `CalZarte — Reporte de Ventas (${periodoLabel})`;
  titleCell.font = { size: 14, bold: true };
  titleCell.alignment = { horizontal: "center" };

  // Columnas
  ws.columns = EXPORT_COLUMNS.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  // Fila de encabezados (fila 3)
  const headerRow = ws.getRow(3);
  EXPORT_COLUMNS.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    cell.alignment = { horizontal: "center" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF000000" } },
    };
  });

  // Datos (a partir de fila 4)
  rows.forEach((row, idx) => {
    const wsRow = ws.getRow(idx + 4);
    EXPORT_COLUMNS.forEach((col, i) => {
      const cell = wsRow.getCell(i + 1);
      cell.value = row[col.key as keyof typeof row];
      if (["precioUnit", "tasa", "total", "totalCUP"].includes(col.key)) {
        cell.alignment = { horizontal: "right" };
      }
      if (idx % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF1F5F9" },
        };
      }
    });
  });

  // Fila de totales
  const completadas = items.filter((i) => i.ventaStatus === "COMPLETED");
  const totalNac = completadas.reduce((s, i) => {
    return (
      s +
      (i.totalNacionalCents != null
        ? i.totalNacionalCents
        : i.totalOriginalCents)
    );
  }, 0);

  const totalRow = ws.getRow(rows.length + 5);
  totalRow.getCell(1).value = "TOTAL";
  totalRow.getCell(1).font = { bold: true };
  totalRow.getCell(4).value = completadas.reduce((s, i) => s + i.cantidad, 0);
  totalRow.getCell(4).font = { bold: true };
  totalRow.getCell(9).value = `${fromCents(totalNac).toFixed(2)} ${MONEDA_NACIONAL}`;
  totalRow.getCell(9).font = { bold: true };

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ventas-calzarte-${Date.now()}.xlsx"`,
    },
  });
}
