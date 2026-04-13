import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type SettlementDetail = {
  productName?: string;
  quantity?: string | number;
  unitPrice?: string | number;
  subtotal?: string | number;
};

type SettlementExpense = {
  concept?: string;
  amount?: string | number;
};

type ProviderSettlementReceiptInput = {
  id?: string | number;
  providerName?: string;
  date?: string;
  receiptDate?: string;
  netAmount?: string | number;
  settlementDetails?: SettlementDetail[];
  settlementExpenses?: SettlementExpense[];
};

const formatCurrency = (value?: string | number) => {
  const amount =
    typeof value === "string"
      ? Number(value.replace(/[^0-9.-]/g, ""))
      : Number(value ?? 0);
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isNaN(amount) ? 0 : amount);
};

export function generateProviderSettlementReceiptPdf(
  settlement: ProviderSettlementReceiptInput,
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  const title = "Distribuidora PINTO";
  const subHeaderRows = [
    "Tomates, chiles, pimientos, jalapenos y pepino",
    "Galpon 6 local 38-39",
    "Galpon 3 local 71-72",
    "Propietario David Pinto",
  ];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, 50, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  subHeaderRows.forEach((row, index) => {
    doc.text(row, pageWidth / 2, 70 + index * 14, { align: "center" });
  });

  const receiptNumber = settlement.id ?? "-";
  const receiptDate =
    settlement.receiptDate ??
    new Date().toLocaleDateString("es-GT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`No: #${receiptNumber}`, 40, 145);
  doc.text(`Date: ${receiptDate}`, pageWidth - 40, 145, { align: "right" });

  doc.text("Provider Name:", 40, 170);
  doc.setFont("helvetica", "normal");
  doc.text(String(settlement.providerName ?? ""), 135, 170);

  autoTable(doc, {
    startY: 190,
    head: [["Producto", "Cantidad", "Precio Unitario", "Subtotal"]],
    body: (settlement.settlementDetails ?? []).map((detail) => [
      detail.productName ?? "",
      String(detail.quantity ?? 0),
      formatCurrency(detail.unitPrice),
      formatCurrency(detail.subtotal),
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39] },
  });

  const finalYAfterProducts = (doc as any).lastAutoTable?.finalY ?? 220;

  autoTable(doc, {
    startY: finalYAfterProducts + 20,
    head: [["Gasto / Deduccion", "Monto"]],
    body:
      (settlement.settlementExpenses ?? []).length > 0
        ? (settlement.settlementExpenses ?? []).map((expense) => [
            expense.concept ?? "",
            formatCurrency(expense.amount),
          ])
        : [["Sin gastos registrados", formatCurrency(0)]],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39] },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? finalYAfterProducts + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(
    `Total del recibo: ${formatCurrency(settlement.netAmount)}`,
    pageWidth - 40,
    finalY + 30,
    { align: "right" },
  );

  doc.save(`recibo-proveedor-${receiptNumber}.pdf`);
}
