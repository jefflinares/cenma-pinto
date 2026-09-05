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

type SettlementPayment = {
  date?: string | Date;
  formattedDate?: string;
  amount?: string | number;
  formattedAmount?: string;
  paymentType?: string;
  formattedPaymentType?: string;
  reference?: string;
};

type ProviderSettlementReceiptInput = {
  id?: string | number;
  providerName?: string;
  incomeDate?: string;
  receiptDate?: string;
  createdAt?: string;
  netAmount?: string | number;
  settlementDetails?: SettlementDetail[];
  settlementExpenses?: SettlementExpense[];
  payments?: SettlementPayment[];
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
  const incomeDate =
    settlement.incomeDate ??
    new Date().toLocaleDateString("es-GT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
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
  doc.text(`Fecha de recibo: ${receiptDate}`, pageWidth - 40, 145, { align: "right" });

  doc.text("Proveedor:", 40, 170);
  doc.setFont("helvetica", "normal");
  doc.text(String(settlement.providerName ?? ""), 135, 170);
  doc.setFont("helvetica", "bold");
  doc.text(`Fecha de ingreso: ${incomeDate}`, pageWidth - 40, 170, { align: "right" });

  const productSubtotal = (settlement.settlementDetails ?? []).reduce(
    (sum, d) => sum + (typeof d.subtotal === "string" ? Number(d.subtotal.replace(/[^0-9.-]/g, "")) : Number(d.subtotal ?? 0)),
    0,
  );

  autoTable(doc, {
    startY: 205,
    head: [["Producto", "Cantidad", "Precio Unitario", "Subtotal"]],
    body: [
      ...(settlement.settlementDetails ?? []).map((detail) => [
        detail.productName ?? "",
        String(detail.quantity ?? 0),
        formatCurrency(detail.unitPrice),
        formatCurrency(detail.subtotal),
      ]),
      ["", "", "Subtotal Productos:", formatCurrency(productSubtotal)],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39] },
    didParseCell: (data) => {
      const isLastRow = data.row.index === (settlement.settlementDetails ?? []).length;
      if (isLastRow) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [249, 250, 251];
      }
    },
  });

  const finalYAfterProducts = (doc as any).lastAutoTable?.finalY ?? 220;

  const expensesSubtotal = (settlement.settlementExpenses ?? []).reduce(
    (sum, e) => sum + (typeof e.amount === "string" ? Number(e.amount.replace(/[^0-9.-]/g, "")) : Number(e.amount ?? 0)),
    0,
  );
  const hasExpenses = (settlement.settlementExpenses ?? []).length > 0;

  autoTable(doc, {
    startY: finalYAfterProducts + 20,
    head: [["Gasto / Deduccion", "Monto"]],
    body: [
      ...(hasExpenses
        ? (settlement.settlementExpenses ?? []).map((expense) => [
            expense.concept ?? "",
            formatCurrency(expense.amount),
          ])
        : [["Sin gastos registrados", formatCurrency(0)]]),
      ...(hasExpenses ? [["Subtotal Gastos:", formatCurrency(expensesSubtotal)]] : []),
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39] },
    didParseCell: (data) => {
      if (!hasExpenses) return;
      const isLastRow = data.row.index === (settlement.settlementExpenses ?? []).length;
      if (isLastRow) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [249, 250, 251];
      }
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? finalYAfterProducts + 20;
  const receiptTotal = productSubtotal - expensesSubtotal;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Subtotal Productos: ${formatCurrency(productSubtotal)}`, pageWidth - 40, finalY + 20, { align: "right" });
  doc.text(`Subtotal Gastos: ${formatCurrency(expensesSubtotal)}`, pageWidth - 40, finalY + 36, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Total del recibo: ${formatCurrency(receiptTotal)}`, pageWidth - 40, finalY + 56, { align: "right" });

  const payments = settlement.payments ?? [];
  autoTable(doc, {
    startY: finalY + 75,
    head: [["Pagos registrados", "", "", ""]],
    body: [],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: "auto" } },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable?.finalY,
    head: [["Fecha", "Monto", "Tipo", "Referencia"]],
    body:
      payments.length > 0
        ? payments.map((p) => [
            p.formattedDate ?? String(p.date ?? ""),
            p.formattedAmount ?? formatCurrency(p.amount),
            p.formattedPaymentType ?? p.paymentType ?? "",
            p.reference ?? "",
          ])
        : [["Sin pagos registrados", "", "", ""]],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39] },
  });

  const finalYAfterPayments = (doc as any).lastAutoTable?.finalY ?? finalY + 50;
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const remaining = Math.max(receiptTotal - totalPaid, 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(
    `Total pagado: ${formatCurrency(totalPaid)}`,
    pageWidth - 40,
    finalYAfterPayments + 20,
    { align: "right" },
  );
  doc.text(
    `Saldo pendiente: ${formatCurrency(remaining)}`,
    pageWidth - 40,
    finalYAfterPayments + 36,
    { align: "right" },
  );

  doc.save(`recibo-proveedor-${receiptNumber}.pdf`);
}
