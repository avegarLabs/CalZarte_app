import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Título
  const periodoLabel =
    desde && hasta ? `${desde} a ${hasta}` : "Todas las ventas";
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CalZarte — Reporte de Ventas", 14, 15);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Periodo: ${periodoLabel}`, 14, 22);
  doc.text(
    `Generado: ${new Date().toLocaleDateString("es-CU")} ${new Date().toLocaleTimeString("es-CU")}`,
    14,
    27,
  );

  // Tabla
  const headers = EXPORT_COLUMNS.map((c) => c.header);
  const body = rows.map((row) =>
    EXPORT_COLUMNS.map((col) => String(row[col.key as keyof typeof row])),
  );

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
  const totalQty = completadas.reduce((s, i) => s + i.cantidad, 0);

  body.push([
    "TOTAL",
    "",
    "",
    String(totalQty),
    "",
    "",
    "",
    "",
    `${fromCents(totalNac).toFixed(2)} ${MONEDA_NACIONAL}`,
    "",
  ]);

  autoTable(doc, {
    startY: 32,
    head: [headers],
    body,
    theme: "grid",
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249],
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 22 },
      2: { cellWidth: 42 },
      3: { halign: "center", cellWidth: 12 },
      4: { halign: "right", cellWidth: 22 },
      5: { halign: "center", cellWidth: 14 },
      6: { halign: "right", cellWidth: 20 },
      7: { halign: "right", cellWidth: 22 },
      8: { halign: "right", cellWidth: 28 },
      9: { halign: "center", cellWidth: 20 },
    },
    didParseCell(data) {
      if (data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [226, 232, 240];
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Pie
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `CalZarte - Pagina ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" },
    );
  }

  const pdfBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ventas-calzarte-${Date.now()}.pdf"`,
    },
  });
}
