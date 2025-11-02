import { isNull, desc } from "drizzle-orm";
import { db } from "../drizzle";
import { customers as customersTable, providers as providersTable } from "../schema";
import { validateSession } from "./util";

export async function getCustomers() {
    const sessionData = await validateSession();
    if (!sessionData) {
        throw new Error('Invalid session');
    }

    const customers = await db
        .select()
        .from(customersTable)
        .where(isNull(customersTable.deletedAt)) // Filter out soft-deleted customersTable
        .orderBy(desc(customersTable.createdAt)); // Order by creation date

    
    if (customers.length === 0) {
        return [];
    }

    return customers;
}