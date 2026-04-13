import { isNull, desc, eq, and } from "drizzle-orm";
import { db } from "../drizzle";
import {
  income,
  incomeDetails,
  products,
  providers,
  providerSettlementDetails,
  providerSettlementExpenses,
  providerSettlements,
  providers as providersTable,
} from "../schema";
import { validateSession } from "./util";

type SettlementParams = {
  settlementId?: number | string;
  from?: string;
  to?: string;
  limit?: number | string;
};

export async function getSettlements(params?: SettlementParams) {
  const sessionData = await validateSession();
  if (!sessionData) {
    throw new Error("Invalid session");
  }
  const { settlementId } = params || {};

  let settlements = await db
    .select({
      id: providerSettlements.id,
      providerId: providerSettlements.providerId,
      incomeDate: income.date,
      providerName: providersTable.name,
      grossAmount: providerSettlements.grossAmount,
      commissionAmount: providerSettlements.commissionAmount,
      netAmount: providerSettlements.netAmount,
      otherDeductions: providerSettlements.otherDeductions,
      status: providerSettlements.status,
    })
    .from(providerSettlements)
    .innerJoin(
      providersTable,
      eq(providerSettlements.providerId, providersTable.id),
    )
    .innerJoin(income, eq(providerSettlements.incomeId, income.id))
    .where(
      and(
        isNull(income.deletedAt),
        settlementId ? eq(providerSettlements.id, Number(settlementId)) : undefined,
      ),
    ) // Filter out soft-deleted products
    .orderBy(desc(providerSettlements.createdAt)); // Order by creation date

  console.log("settlements: ", settlements);

  settlements = await Promise.all(
    settlements.map(async (settlement) => {
      return {
        ...settlement,
        formattedDate: new Date(settlement.incomeDate)
          .toLocaleDateString("en-GB")
          .toString(),
        settlementDetails: await db
          .select({
            id: providerSettlementDetails.id,
            incomeDetailId: providerSettlementDetails.incomeDetailId,
            productId: products.id,
            productName: products.name,
            stock: incomeDetails.quantity,
            quantity: providerSettlementDetails.quantity,
            unitPrice: providerSettlementDetails.unitPrice,
            subtotal: providerSettlementDetails.subtotal,
            splitted: providerSettlementDetails.splitted,
            comission: providerSettlementDetails.comission,
            totalComission: providerSettlementDetails.totalComission,
            reason: providerSettlementDetails.reason,
          })
          .from(providerSettlementDetails)
          .leftJoin(
            incomeDetails,
            eq(providerSettlementDetails.incomeDetailId, incomeDetails.id),
          )
          .leftJoin(products, eq(incomeDetails.productId, products.id))
          .where(eq(providerSettlementDetails.settlementId, settlement.id)),
        settlementExpenses: await db
          .select({
            id: providerSettlementExpenses.id,
            amount: providerSettlementExpenses.amount,
            concept: providerSettlementExpenses.concept,
          })
          .from(providerSettlementExpenses)
          .where(eq(providerSettlementExpenses.settlementId, settlement.id)),
      };
    }),
  );

  settlements.forEach((s) => {
    // `s` is augmented later with details/expenses so its statically inferred type
    // doesn't include those properties.  Cast to any to avoid compiler complaints.
    console.log("Settlement: ", s, (s as any).settlementDetails, (s as any).settlementExpenses);
  });

  return settlements ?? [];
}
