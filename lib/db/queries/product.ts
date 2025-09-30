import { isNull, desc, eq } from "drizzle-orm";
import { db } from "../drizzle";
import { containers as containersTable, products as productsTable } from "../schema";
import { validateSession } from "./util";

export async function getProducts() {
    const sessionData = await validateSession();
    if (!sessionData) {
        throw new Error('Invalid session');
    }

    const products = await db
        .select({
            id: productsTable.id,
            name: productsTable.name,
            container: containersTable.name
        })
        .from(productsTable)
        .innerJoin(containersTable, eq(containersTable.id, productsTable.container))
        .where(isNull(productsTable.deletedAt)) // Filter out soft-deleted products
        .orderBy(desc(productsTable.createdAt)); // Order by creation date

    console.log('Products: ', products)
    if (products.length === 0) {
        return [];
    }

    return products;
}