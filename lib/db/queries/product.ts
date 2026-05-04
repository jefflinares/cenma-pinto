import { isNull, desc, eq } from "drizzle-orm";
import { db } from "../drizzle";
import { containers as containersTable, products as productsTable, productClassification as productClassificationTable } from "../schema";
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
            container: containersTable.name,
            containerId: productsTable.container,
            productClassification: productClassificationTable.name,
            productClassificationId: productClassificationTable.id,
            svgIcon: productClassificationTable.svgIcon,
        })
        .from(productsTable)
        .innerJoin(containersTable, eq(containersTable.id, productsTable.container))
        .leftJoin(productClassificationTable, eq(productClassificationTable.id, productsTable.productClassification))
        .where(isNull(productsTable.deletedAt)) // Filter out soft-deleted products
        .orderBy(desc(productsTable.createdAt)); // Order by creation date

    console.log('Products: ', products)

    if (products.length === 0) {
        return [];
    }

    return products;
}