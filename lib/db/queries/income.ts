import { isNull, desc, eq, and } from "drizzle-orm";
import { db } from "../drizzle";
import { income, incomeDetails, products, providers } from "../schema";
import { validateSession } from "./util";

export async function getIncomes() {
    const sessionData = await validateSession();
    if (!sessionData) {
        throw new Error('Invalid session');
    }

    let incomes = await db
        .select({
            id: income.id,
            date: income.date,
            providerId: income.providerId,
            providerName: providers.name,
            createdAt: income.createdAt,
            updatedAt: income.updatedAt,
            deletedAt: income.deletedAt,
        })
        .from(income)
        .innerJoin(providers, eq(income.providerId, providers.id))
        .where(isNull(income.deletedAt)) // Filter out soft-deleted products
        .orderBy(desc(income.createdAt)); // Order by creation date

    // For each income, get its details
    incomes = await Promise.all(incomes.map(async (incomeRow) => {
        return {
            ...incomeRow,
            formatedDate: new Date(incomeRow.date).toLocaleDateString('en-GB').toString(),
            incomeDetails: await db
            .select({
                id: incomeDetails.id,
                incomeId: incomeDetails.incomeId,
                productId: incomeDetails.productId,
                price: incomeDetails.price,
                productName: products.name,
                quantity: incomeDetails.quantity,
            })
            .from(incomeDetails)
            .innerJoin(products, eq(incomeDetails.productId, products.id))
            .where(and(isNull(incomeDetails.deletedAt), eq(incomeDetails.incomeId, incomeRow.id))),
        };
    }));

    console.log('Incomes: ', incomes)
    if (incomes.length === 0) {
        return [];
    }

    return incomes
}