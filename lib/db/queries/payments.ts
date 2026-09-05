import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../drizzle";
import { payments, providerPayments, providerSettlements, users } from "../schema";
import { validateSession } from "./util";

export async function getCustomerPaymentsByOrderId(orderId: number) {
  const sessionData = await validateSession();
  if (!sessionData) throw new Error("Invalid session");

  const rows = await db
    .select({
      id: payments.id,
      orderId: payments.orderId,
      customerId: payments.customerId,
      amount: payments.amount,
      date: payments.date,
      paymentType: payments.paymentType,
      reference: payments.reference,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(and(eq(payments.orderId, orderId), isNull(payments.deletedAt)))
    .orderBy(desc(payments.createdAt));

  return rows.map((p) => ({
    ...p,
    formattedDate: p.date ? new Date(p.date).toLocaleDateString("en-GB") : null,
  }));
}

type PaymentParams = {
  settlementId?: number | string;
};

export async function getProviderPayments(params?: PaymentParams) {
  const sessionData = await validateSession();
  if (!sessionData) {
    throw new Error("Invalid session");
  }

  const { settlementId } = params || {};

  const payments = await db
    .select({
      id: providerPayments.id,
      settlementId: providerPayments.settlementId,
      netAmount: providerSettlements.netAmount,
      amount: providerPayments.amount,
      date: providerPayments.date,
      paymentType: providerPayments.paymentType,
      reference: providerPayments.reference,
      createdBy: providerPayments.createdBy,
      createdAt: providerPayments.createdAt,
    })
    .from(providerPayments)
    .innerJoin(
      providerSettlements,
      eq(providerPayments.settlementId, providerSettlements.id),
    )
    .where(
      settlementId
        ? and(
            eq(providerPayments.settlementId, Number(settlementId)),
            isNull(providerPayments.deletedAt),
          )
        : isNull(providerPayments.deletedAt),
    )
    .orderBy(desc(providerPayments.createdAt));

  console.log("payments: ", payments);

  return payments.map((payment) => ({
    ...payment,
    formattedDate: payment.date
      ? new Date(payment.date).toLocaleDateString("en-GB").toString()
      : null,
  }));
}