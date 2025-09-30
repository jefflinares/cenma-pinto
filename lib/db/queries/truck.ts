import { isNull, desc, eq } from "drizzle-orm";
import { db } from "../drizzle";
import { trucks as trucksTable } from "../schema";
import { validateSession } from "./util";
import { providers as providersTable } from "../schema";

export async function getTrucks() {
    const sessionData = await validateSession();
    if (!sessionData) {
        throw new Error('Invalid session');
    }
    
    const trucks = await db
        .select({
            id: trucksTable.id,
            plate: trucksTable.plate,
            ownerId: trucksTable.ownerId,
            providerName: providersTable.name
        })
        .from(trucksTable)
        .innerJoin(providersTable, eq(trucksTable.ownerId, providersTable.id))
        .where(isNull(trucksTable.deletedAt))
        .orderBy(desc(trucksTable.createdAt));

    console.log('trucksTable: ', trucks)
    if (trucks.length === 0) {
        return [];
    }

    return trucks;
}