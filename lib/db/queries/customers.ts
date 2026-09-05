import { isNull, desc, eq, and } from "drizzle-orm";
import { db } from "../drizzle";
import { customers as customersTable, customerAccounts } from "../schema";
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

export async function getCustomerById(id: number) {
  const sessionData = await validateSession();
  if (!sessionData) throw new Error("Invalid session");

  const [customer] = await db
    .select({
      id: customersTable.id,
      name: customersTable.name,
      phone: customersTable.phone,
      email: customersTable.email,
      address: customersTable.address,
      createdAt: customersTable.createdAt,
      balance: customerAccounts.balance,
      accountUpdatedAt: customerAccounts.updatedAt,
    })
    .from(customersTable)
    .leftJoin(customerAccounts, eq(customerAccounts.customerId, customersTable.id))
    .where(and(eq(customersTable.id, id), isNull(customersTable.deletedAt)));

  return customer ?? null;
}