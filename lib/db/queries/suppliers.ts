import { isNull, desc } from "drizzle-orm";
import { db } from "../drizzle";
import { providers as providersTable } from "../schema";
import { validateSession } from "./util";

export async function getSuppliers() {
    const sessionData = await validateSession();
    if (!sessionData) {
        throw new Error('Invalid session');
    }

    const suppliers = await db
        .select()
        .from(providersTable)
        .where(isNull(providersTable.deletedAt)) // Filter out soft-deleted suppliers
        .orderBy(desc(providersTable.createdAt)); // Order by creation date

    console.log('Suppliers: ', suppliers)
    if (suppliers.length === 0) {
        return [];
    }

    return suppliers;
}