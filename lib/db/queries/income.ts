import { isNull, desc, eq, and, gt, sql } from "drizzle-orm";
import { db } from "../drizzle";
import { income, incomeDetails, products, providers, providerSettlements, providerPayments, containers } from "../schema";
import { validateSession } from "./util";

type IncomeParams = {
  id?: number;
  from?: string;
  to?: string;
  limit?: number;
  withAvailableStock?: boolean;
  forSettlement?: boolean;
};

export async function getIncomes(params: IncomeParams) {
  const sessionData = await validateSession();
  if (!sessionData) {
    throw new Error("Invalid session");
  }
  const { from, to, limit, withAvailableStock = false, forSettlement = false, id } = params;
  console.log("🚀 ~ getIncomes ~ withAvailableStock:", withAvailableStock);
  let incomes = await db
    .select({
      id: income.id,
      date: income.date,
      providerId: income.providerId,
      providerName: providers.name,
      status: income.status,
      providerSettlementId: income.providerSettlementId,
      resolvedSettlementId: providerSettlements.id,
      settlementNetAmount: providerSettlements.netAmount,
      createdAt: income.createdAt,
      updatedAt: income.updatedAt,
      deletedAt: income.deletedAt,
    })
    .from(income)
    .innerJoin(providers, eq(income.providerId, providers.id))
    .leftJoin(providerSettlements, eq(providerSettlements.incomeId, income.id))
    .where(and(isNull(income.deletedAt), id ? eq(income.id, id) : undefined))
    .orderBy(desc(income.createdAt));

  // For each income, get its details
  incomes = await Promise.all(
    incomes.map(async (incomeRow) => {
      const settlementId = incomeRow.providerSettlementId ?? incomeRow.resolvedSettlementId;

      let settlementTotalPaid = 0;
      if (settlementId) {
        const [payRow] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${providerPayments.amount}::numeric), 0)`,
          })
          .from(providerPayments)
          .where(and(isNull(providerPayments.deletedAt), eq(providerPayments.settlementId, settlementId)));
        settlementTotalPaid = Number(payRow?.total ?? 0);
      }

      return {
        ...incomeRow,
        providerSettlementId: settlementId,
        settlementTotalPaid,
        formattedDate: (() => {
          const [year, month, day] = incomeRow.date.split("-");
          return `${day}/${month}/${year}`;
        })(),
        incomeDetails: await db
          .select({
            id: incomeDetails.id,
            incomeId: incomeDetails.incomeId,
            productId: incomeDetails.productId,
            price: incomeDetails.price,
            productName: products.name,
            quantity: incomeDetails.quantity,
            stock: forSettlement ? incomeDetails.quantity : incomeDetails.remainingQuantity,
            containerId: products.container,
          })
          .from(incomeDetails)
          .innerJoin(products, eq(incomeDetails.productId, products.id))
          .where(
            and(
              isNull(incomeDetails.deletedAt),
              eq(incomeDetails.incomeId, incomeRow.id),
              withAvailableStock
                ? gt(incomeDetails.remainingQuantity, 0)
                : undefined,
              gt(incomeDetails.quantity, 0),
            ),
          ),
      };
    }),
  );

if (incomes.length === 0) {
    return [];
  }

  return incomes;
}
