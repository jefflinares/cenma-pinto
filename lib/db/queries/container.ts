import { isNull, desc } from "drizzle-orm";
import { db } from "../drizzle";
import { containers as containerTable } from "../schema";
import { validateSession } from "./util";

export async function getContainers() {
    const sessionData = await validateSession();
    if (!sessionData) {
        throw new Error('Invalid session');
    }

    const containers = await db
        .select()
        .from(containerTable)
        .where(isNull(containerTable.deletedAt)) // Filter out soft-deleted containers
        .orderBy(desc(containerTable.createdAt)); // Order by creation date

    console.log('Containers: ', containers)
    if (containers.length === 0) {
        return [];
    }

    return containers;
}
