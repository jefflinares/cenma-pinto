import { and, desc, eq, lt, sql } from "drizzle-orm";
import { db } from "../drizzle";
import { cashDaySummary, cashMovements } from "../schema";
import { validateSession } from "./util";

export async function getCashMovementsForDate(date: string) {
  const sessionData = await validateSession();
  if (!sessionData) throw new Error("Invalid session");

  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59`);

  return db
    .select()
    .from(cashMovements)
    .where(
      and(
        sql`${cashMovements.date} >= ${start}`,
        sql`${cashMovements.date} <= ${end}`,
      ),
    )
    .orderBy(desc(cashMovements.date));
}

export async function getCashDaySummary(date: string) {
  const sessionData = await validateSession();
  if (!sessionData) throw new Error("Invalid session");

  const [row] = await db
    .select()
    .from(cashDaySummary)
    .where(eq(cashDaySummary.date, date))
    .limit(1);

  return row ?? null;
}

export async function getPreviousClosingBalance(date: string) {
  const sessionData = await validateSession();
  if (!sessionData) throw new Error("Invalid session");

  const [row] = await db
    .select({ closingBalance: cashDaySummary.closingBalance })
    .from(cashDaySummary)
    .where(and(lt(cashDaySummary.date, date), sql`${cashDaySummary.closingBalance} IS NOT NULL`))
    .orderBy(desc(cashDaySummary.date))
    .limit(1);

  return row?.closingBalance ?? null;
}
