import { isNull, desc, eq, and, gt } from "drizzle-orm";
import { db } from "../drizzle";
import { income, incomeDetails, products, providers } from "../schema";
import { validateSession } from "./util";

type IncomeParams = {
  id?: number;
  from?: string;
  to?: string;
  limit?: number;
  withAvailableStock?: boolean;
};

export async function getIncomes(params: IncomeParams) {
  const sessionData = await validateSession();
  if (!sessionData) {
    throw new Error("Invalid session");
  }
  const { from, to, limit, withAvailableStock = false, id } = params;
  console.log("🚀 ~ getIncomes ~ withAvailableStock:", withAvailableStock);
  let incomes = await db
    .select({
      id: income.id,
      date: income.date,
      providerId: income.providerId,
      providerName: providers.name,
      status: income.status,
      providerSettlementId: income.providerSettlementId,
      createdAt: income.createdAt,
      updatedAt: income.updatedAt,
      deletedAt: income.deletedAt,
    })
    .from(income)
    .innerJoin(providers, eq(income.providerId, providers.id))
    .where(and(isNull(income.deletedAt), id ? eq(income.id, id) : undefined)) // Filter out soft-deleted products
    .orderBy(desc(income.createdAt)); // Order by creation date

  // For each income, get its details
  incomes = await Promise.all(
    incomes.map(async (incomeRow) => {
      return {
        ...incomeRow,
        formattedDate: new Date(incomeRow.date)
          .toLocaleDateString("en-GB")
          .toString(),
        incomeDetails: await db
          .select({
            id: incomeDetails.id,
            incomeId: incomeDetails.incomeId,
            productId: incomeDetails.productId,
            price: incomeDetails.price,
            productName: products.name,
            quantity: incomeDetails.quantity,
            stock: incomeDetails.remainingQuantity,
          })
          .from(incomeDetails)
          .innerJoin(products, eq(incomeDetails.productId, products.id))
          .where(
            and(
              isNull(incomeDetails.deletedAt),
              eq(incomeDetails.incomeId, incomeRow.id),
              withAvailableStock
                ? gt(incomeDetails.remainingQuantity, "0")
                : undefined,
              gt(incomeDetails.quantity, "0"),
            ),
          ),
      };
    }),
  );

  /*incomes.forEach((income) => {
    console.log("Incomes: ", income.incomeDetails);
  });*/
  if (incomes.length === 0) {
    return [];
  }

  return incomes;
}
