import { Income, IncomeDetail } from "@/lib/db/schema";

export type IncomeDetailRow = IncomeDetail & {
  productName?: string;
  stock: number;
  unitPrice?: number;
  containerId?: number | null;
};

export type IncomeRow = Income & {
  formattedDate?: string;
  providerName?: string;
  incomeDetails?: IncomeDetailRow[];
  settlementNetAmount?: string | null;
  settlementTotalPaid?: number;
};
