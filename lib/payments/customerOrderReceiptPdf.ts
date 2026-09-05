import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

type OrderDetail = {
  productName?: string;
  quantity?: string | number;
  price?: string | number;
};

type OrderPayment = {
  formattedDate?: string;
  date?: string | Date;
  amount?: string | number;
  paymentType?: string;
  reference?: string | null;
};

type CustomerOrderReceiptInput = {
  id?: string | number;
  customerName?: string;
  formattedDate?: string;
  orderDetails?: OrderDetail[];
  payments?: OrderPayment[];
};

const paymentTypeLabel: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  check: "Cheque",
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

export function generateCustomerOrderReceiptPdf(order: CustomerOrderReceiptInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // --- Header ---
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

  // --- Order meta ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Orden #${order.id ?? "-"}`, 40, 145);
  doc.text(`Fecha: ${order.formattedDate ?? "-"}`, pageWidth - 40, 145, { align: "right" });

  doc.text("Cliente:", 40, 170);
  doc.setFont("helvetica", "normal");
  doc.text(String(order.customerName ?? ""), 100, 170);

  // --- Products table ---
  const details = order.orderDetails ?? [];
  const orderTotal = details.reduce(
    (sum, d) => sum + Number(d.quantity ?? 0) * Number(d.price ?? 0),
    0,
  );

  autoTable(doc, {
    startY: 200,
    head: [["Producto", "Cantidad", "Precio Unitario", "Subtotal"]],
    body: [
      ...details.map((d) => [
        d.productName ?? "",
        String(d.quantity ?? 0),
        formatCurrency(d.price),
        formatCurrency(Number(d.quantity ?? 0) * Number(d.price ?? 0)),
      ]),
      ["", "", "Total:", formatCurrency(orderTotal)],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39] },
    didParseCell: (data) => {
      if (data.row.index === details.length) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [249, 250, 251];
      }
    },
  });

  const finalYAfterProducts = (doc as any).lastAutoTable?.finalY ?? 220;

  // --- Payments table ---
  const payments = order.payments ?? [];
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const remaining = Math.max(orderTotal - totalPaid, 0);

  autoTable(doc, {
    startY: finalYAfterProducts + 20,
    head: [["Fecha", "Monto", "Tipo", "Referencia"]],
    body:
      payments.length > 0
        ? payments.map((p) => [
            p.formattedDate ?? String(p.date ?? ""),
            formatCurrency(p.amount),
            paymentTypeLabel[p.paymentType ?? ""] ?? p.paymentType ?? "",
            p.reference ?? "-",
          ])
        : [["Sin pagos registrados", "", "", ""]],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39] },
  });

  const finalY = (doc as any).lastAutoTable?.finalY ?? finalYAfterProducts + 40;

  // --- Summary ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Total de orden: ${formatCurrency(orderTotal)}`, pageWidth - 40, finalY + 20, { align: "right" });
  doc.text(`Total pagado: ${formatCurrency(totalPaid)}`, pageWidth - 40, finalY + 36, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(`Saldo pendiente: ${formatCurrency(remaining)}`, pageWidth - 40, finalY + 56, { align: "right" });

  const safeName = (order.customerName ?? "cliente").replace(/\s+/g, "_");
  doc.save(`${safeName}_${order.id}.pdf`);
}
