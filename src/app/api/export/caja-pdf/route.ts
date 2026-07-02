import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { MONEDA_NACIONAL, type Moneda } from "@/db/constants";
import {
  obtenerCajaCompleta,
  obtenerCajaAbierta,
} from "@/services/caja.service";
import { DENOMINACIONES, MONEDAS_LABEL } from "@/lib/denominaciones";
import { fromCents, formatMoney, convertToNationalCents } from "@/lib/money";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const idParam = searchParams.get("id");

  const data = idParam
    ? obtenerCajaCompleta(Number(idParam))
    : obtenerCajaAbierta();

  if (!data) {
    return new NextResponse("Arqueo no encontrado", { status: 404 });
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Título
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("CalZarte — Arqueo de Caja", 14, 15);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Fecha: ${data.caja.fecha.toLocaleDateString("es-CU")} ${data.caja.fecha.toLocaleTimeString("es-CU")}`,
    14,
    22,
  );
  if (data.caja.notas) {
    doc.text(`Notas: ${data.caja.notas}`, 14, 27);
  }
  doc.text(
    `Estado: ${data.caja.status === "OPEN" ? "Abierta" : "Cerrada"}`,
    14,
    data.caja.notas ? 32 : 27,
  );

  let startY = data.caja.notas ? 38 : 33;

  // Tabla por moneda
  const monedas = Object.keys(data.totalesPorMoneda).sort();

  for (const moneda of monedas) {
    const detallesMoneda = data.detalles
      .filter((d) => d.moneda === moneda)
      .sort((a, b) => b.denominacionCents - a.denominacionCents);

    if (detallesMoneda.length === 0) continue;

    const totalCents = data.totalesPorMoneda[moneda];
    const tasa = data.tasasUsadas[moneda];
    const label = MONEDAS_LABEL[moneda as Moneda] ?? moneda;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(label, 14, startY);
    if (tasa) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        `(Tasa: ${formatMoney(tasa, MONEDA_NACIONAL)})`,
        14 + doc.getTextWidth(label + "  "),
        startY,
      );
    }
    startY += 3;

    const headers = ["Denominación", "Cantidad", "Subtotal"];
    const body = detallesMoneda.map((d) => {
      const denom = DENOMINACIONES[moneda as Moneda]?.find(
        (x) => x.valorCents === d.denominacionCents,
      );
      return [
        denom?.label ?? `${fromCents(d.denominacionCents).toFixed(2)}`,
        String(d.cantidad),
        `${fromCents(d.denominacionCents * d.cantidad).toFixed(2)} ${moneda}`,
      ];
    });

    body.push([
      "SUBTOTAL",
      "",
      `${fromCents(totalCents).toFixed(2)} ${moneda}`,
    ]);

    autoTable(doc, {
      startY,
      head: [headers],
      body,
      theme: "grid",
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
        fontSize: 9,
      },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { halign: "center", cellWidth: 30 },
        2: { halign: "right", cellWidth: 50 },
      },
      didParseCell(cellData) {
        if (cellData.row.index === body.length - 1) {
          cellData.cell.styles.fontStyle = "bold";
          cellData.cell.styles.fillColor = [226, 232, 240];
        }
      },
      margin: { left: 14, right: 14 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    startY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Resumen general
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen General", 14, startY);
  startY += 3;

  const resumenBody: string[][] = [];

  for (const moneda of monedas) {
    const totalCents = data.totalesPorMoneda[moneda];
    const tasa = data.tasasUsadas[moneda];
    if (moneda === MONEDA_NACIONAL) {
      resumenBody.push([
        moneda,
        `${fromCents(totalCents).toFixed(2)} ${moneda}`,
        "—",
        `${fromCents(totalCents).toFixed(2)} ${MONEDA_NACIONAL}`,
      ]);
    } else if (tasa) {
      const cupEquiv = convertToNationalCents(totalCents, tasa);
      resumenBody.push([
        moneda,
        `${fromCents(totalCents).toFixed(2)} ${moneda}`,
        `${fromCents(tasa).toFixed(2)}`,
        `${fromCents(cupEquiv).toFixed(2)} ${MONEDA_NACIONAL}`,
      ]);
    }
  }

  resumenBody.push([
    "TOTAL GENERAL",
    "",
    "",
    `${fromCents(data.totalCupCents).toFixed(2)} ${MONEDA_NACIONAL}`,
  ]);

  autoTable(doc, {
    startY,
    head: [["Moneda", "Total", `Tasa (${MONEDA_NACIONAL})`, `Equiv. ${MONEDA_NACIONAL}`]],
    body: resumenBody,
    theme: "grid",
    headStyles: {
      fillColor: [22, 163, 74],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 30 },
      1: { halign: "right", cellWidth: 45 },
      2: { halign: "right", cellWidth: 35 },
      3: { halign: "right", cellWidth: 50 },
    },
    didParseCell(cellData) {
      if (cellData.row.index === resumenBody.length - 1) {
        cellData.cell.styles.fontStyle = "bold";
        cellData.cell.styles.fillColor = [187, 247, 208];
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
      `CalZarte - Arqueo de Caja - Pagina ${i} de ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" },
    );
  }

  const pdfBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="arqueo-caja-${data.caja.id}-${Date.now()}.pdf"`,
    },
  });
}
