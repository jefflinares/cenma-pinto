import { isNull, desc } from "drizzle-orm";
import { db } from "../drizzle";
import { productClassification } from "../schema";
import { validateSession } from "./util";

export async function getProductClassifications() {
    const sessionData = await validateSession();
    if (!sessionData) {
        throw new Error('Invalid session');
    }

    const classifications = await db
        .select()
        .from(productClassification)
        .where(isNull(productClassification.deletedAt))
        .orderBy(desc(productClassification.createdAt));

    console.log('Product Classifications: ', classifications)
    if (classifications.length === 0) {
        return [];
    }

    return classifications;
}
