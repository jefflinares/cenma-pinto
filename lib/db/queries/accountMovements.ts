import { desc, eq } from "drizzle-orm";
import { db } from "../drizzle";
import { accountMovements, customerAccounts, payments } from "../schema";
import { validateSession } from "./util";

export async function getAccountMovementsByCustomerId(customerId: number) {
  const sessionData = await validateSession();
  if (!sessionData) throw new Error("Invalid session");

  const [account] = await db
    .select({ id: customerAccounts.id })
    .from(customerAccounts)
    .where(eq(customerAccounts.customerId, customerId));

  if (!account) return [];

  const rows = await db
    .select({
      id: accountMovements.id,
      type: accountMovements.type,
      amount: accountMovements.amount,
      orderId: accountMovements.orderId,
      paymentId: accountMovements.paymentId,
      createdAt: accountMovements.createdAt,
      paymentType: payments.paymentType,
    })
    .from(accountMovements)
    .leftJoin(payments, eq(accountMovements.paymentId, payments.id))
    .where(eq(accountMovements.customerAccountId, account.id))
    .orderBy(desc(accountMovements.createdAt));

  const paymentTypeLabel: Record<string, string> = {
    cash: "Efectivo",
    transfer: "Transferencia",
    card: "Tarjeta",
    check: "Cheque",
  };

  return rows.map((r) => ({
    ...r,
    formattedDate: new Date(r.createdAt).toLocaleDateString("en-GB"),
    concept:
      r.type === "CREDIT"
        ? (paymentTypeLabel[r.paymentType ?? ""] ?? "Pago")
        : r.orderId
          ? `Venta #${r.orderId}`
          : "Cargo",
  }));
}
