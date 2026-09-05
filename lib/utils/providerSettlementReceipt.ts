import { generateProviderSettlementReceiptPdf } from "@/lib/payments/providerSettlementReceiptPdf";

type ReceiptSettlementInput = {
  id?: string | number;
  providerName?: string;
  incomeDate?: string;
  netAmount?: string | number;
  settlementDetails?: Array<{
    productName?: string;
    quantity?: string | number;
    unitPrice?: string | number;
    subtotal?: string | number;
  }>;
  settlementExpenses?: Array<{
    concept?: string;
    amount?: string | number;
  }>;
  payments?: Array<{
    date?: string | Date;
    formattedDate?: string;
    amount?: string | number;
    formattedAmount?: string;
    paymentType?: string;
    formattedPaymentType?: string;
    reference?: string;
  }>;
};

export function downloadProviderSettlementReceipt(
  settlement: ReceiptSettlementInput,
) {
  generateProviderSettlementReceiptPdf({
    id: settlement.id,
    providerName: settlement.providerName,
    incomeDate: settlement.incomeDate,
    receiptDate: new Date().toLocaleDateString("es-GT"),
    netAmount: settlement.netAmount,
    settlementDetails: settlement.settlementDetails,
    settlementExpenses: settlement.settlementExpenses,
    payments: settlement.payments,
  });
}
