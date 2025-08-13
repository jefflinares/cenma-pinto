import { isNull, desc } from "drizzle-orm";
import { db } from "../drizzle";
import { products as productsTable } from "../schema";
import { validateSession } from "./util";

export async function getProducts() {
    const sessionData = await validateSession();
    if (!sessionData) {
        throw new Error('Invalid session');
    }

    const products = await db
        .select()
        .from(productsTable) 
        .where(isNull(productsTable.deletedAt)) // Filter out soft-deleted products
        .orderBy(desc(productsTable.createdAt)); // Order by creation date

    console.log('Products: ', products)
    if (products.length === 0) {
        return [];
    }

    return products;
}