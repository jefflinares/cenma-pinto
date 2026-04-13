import { generateProviderSettlementReceiptPdf } from "@/lib/payments/providerSettlementReceiptPdf";

type ReceiptSettlementInput = {
  id?: string | number;
  providerName?: string;
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
};

export function downloadProviderSettlementReceipt(
  settlement: ReceiptSettlementInput,
) {
  generateProviderSettlementReceiptPdf({
    id: settlement.id,
    providerName: settlement.providerName,
    receiptDate: new Date().toLocaleDateString("es-GT"),
    netAmount: settlement.netAmount,
    settlementDetails: settlement.settlementDetails,
    settlementExpenses: settlement.settlementExpenses,
  });
}
