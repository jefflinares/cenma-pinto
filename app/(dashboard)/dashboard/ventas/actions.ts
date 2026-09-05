"use server";

import { logActivity } from "@/app/(login)/actions";
import { validatedActionWithUser, ActionState } from "@/lib/auth/middleware";
import { db } from "@/lib/db/drizzle";
import {
  ActivityType,
  accountMovements,
  customerAccounts,
  customerOrderDetails,
  customerOrders,
  payments,
} from "@/lib/db/schema";
import { and, eq, isNull, ne, sql } from "drizzle-orm";
import z from "zod";

// ---------------------------------------------------------------------------
// addCustomerPayment
// ---------------------------------------------------------------------------

const addCustomerPaymentSchema = z.object({
  orderId: z.union([z.string().min(1).transform(Number), z.number().int()]),
  customerId: z.union([z.string().min(1).transform(Number), z.number().int()]),
  amount: z.union([z.string().min(1).transform(Number), z.number()]),
  date: z.string().min(1),
  paymentType: z.string().min(1),
  reference: z.string().optional(),
});

export const addCustomerPayment = validatedActionWithUser(
  addCustomerPaymentSchema,
  async (data, _, user) => {
    const { orderId, customerId, amount, date, paymentType, reference } = data as any;

    try {
      const requested = Number(Number(amount).toFixed(2));
      if (!requested || requested <= 0) {
        return { error: "El monto debe ser mayor a cero." };
      }

      const result = await db.transaction(async (tx) => {
        // 1. Validate order exists and is confirmed
        const [order] = await tx
          .select({ id: customerOrders.id, status: customerOrders.status })
          .from(customerOrders)
          .where(eq(customerOrders.id, Number(orderId)));

        if (!order) throw new Error("ORDER_NOT_FOUND");
        if (order.status !== "confirmed" && order.status !== "paid") {
          throw new Error("ORDER_NOT_CONFIRMED");
        }

        // 2. Calculate order total
        const [totalRow] = await tx
          .select({
            total: sql<string>`COALESCE(SUM(${customerOrderDetails.quantity}::numeric * ${customerOrderDetails.price}::numeric), 0)`,
          })
          .from(customerOrderDetails)
          .where(
            and(
              eq(customerOrderDetails.orderId, Number(orderId)),
              isNull(customerOrderDetails.deletedAt),
            ),
          );
        const orderTotal = Number(totalRow?.total ?? 0);

        // 3. Sum existing payments for this order
        const [paidRow] = await tx
          .select({
            total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
          })
          .from(payments)
          .where(
            and(
              eq(payments.orderId, Number(orderId)),
              isNull(payments.deletedAt),
            ),
          );
        const alreadyPaid = Number(paidRow?.total ?? 0);
        const available = Number((orderTotal - alreadyPaid).toFixed(2));

        if (requested > available) {
          throw new Error(`PAYMENT_EXCEEDS_AVAILABLE:${available.toFixed(2)}`);
        }

        // 4. Insert payment
        const [newPayment] = await tx
          .insert(payments)
          .values({
            customerId: Number(customerId),
            orderId: Number(orderId),
            date: new Date(`${String(date)}T12:00:00`),
            amount: String(requested),
            paymentType: String(paymentType),
            reference: String(reference ?? "") || null,
            createdBy: user.id,
          })
          .returning();

        // 5. Update customer account balance
        const [account] = await tx
          .select({ id: customerAccounts.id, balance: customerAccounts.balance })
          .from(customerAccounts)
          .where(eq(customerAccounts.customerId, Number(customerId)));

        if (account) {
          await tx
            .update(customerAccounts)
            .set({
              balance: String(Number(account.balance) - requested),
              updatedAt: new Date(),
            })
            .where(eq(customerAccounts.id, account.id));

          // 6. Insert CREDIT movement
          await tx.insert(accountMovements).values({
            customerAccountId: account.id,
            type: "CREDIT",
            amount: String(requested),
            orderId: Number(orderId),
            paymentId: newPayment.id,
          });
        }

        return newPayment;
      });

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.CREATE_CUSTOMER_PAYMENT);

      return { ...result, success: "Pago registrado exitosamente." };
    } catch (error: any) {
      if (error?.message === "ORDER_NOT_FOUND") return { error: "La venta indicada no existe." };
      if (error?.message === "ORDER_NOT_CONFIRMED") return { error: "Solo se pueden registrar pagos en ventas confirmadas." };
      if (typeof error?.message === "string" && error.message.startsWith("PAYMENT_EXCEEDS_AVAILABLE:")) {
        const available = error.message.split(":")[1] ?? "0.00";
        return { error: `El pago excede el saldo pendiente. Disponible: Q${available}.` };
      }
      console.error("addCustomerPayment error", error);
      return { error: "Error al registrar el pago." };
    }
  },
);

// ---------------------------------------------------------------------------
// updateCustomerPayment
// ---------------------------------------------------------------------------

const updateCustomerPaymentSchema = z.object({
  id: z.union([z.string().min(1).transform(Number), z.number().int()]),
  orderId: z.union([z.string().min(1).transform(Number), z.number().int()]),
  customerId: z.union([z.string().min(1).transform(Number), z.number().int()]),
  amount: z.union([z.string().min(1).transform(Number), z.number()]),
  date: z.string().min(1),
  paymentType: z.string().min(1),
  reference: z.string().optional(),
});

export const updateCustomerPayment = validatedActionWithUser(
  updateCustomerPaymentSchema,
  async (data, _, user) => {
    const { id, orderId, customerId, amount, date, paymentType, reference } = data as any;

    try {
      const requested = Number(Number(amount).toFixed(2));
      if (!requested || requested <= 0) {
        return { error: "El monto debe ser mayor a cero." };
      }

      const result = await db.transaction(async (tx) => {
        // 1. Get existing payment
        const [existing] = await tx
          .select({ id: payments.id, amount: payments.amount })
          .from(payments)
          .where(and(eq(payments.id, Number(id)), isNull(payments.deletedAt)));

        if (!existing) throw new Error("PAYMENT_NOT_FOUND");

        const oldAmount = Number(existing.amount);

        // 2. Calculate order total
        const [totalRow] = await tx
          .select({
            total: sql<string>`COALESCE(SUM(${customerOrderDetails.quantity}::numeric * ${customerOrderDetails.price}::numeric), 0)`,
          })
          .from(customerOrderDetails)
          .where(
            and(
              eq(customerOrderDetails.orderId, Number(orderId)),
              isNull(customerOrderDetails.deletedAt),
            ),
          );
        const orderTotal = Number(totalRow?.total ?? 0);

        // 3. Sum other payments (excluding current)
        const [paidRow] = await tx
          .select({
            total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
          })
          .from(payments)
          .where(
            and(
              eq(payments.orderId, Number(orderId)),
              isNull(payments.deletedAt),
              ne(payments.id, Number(id)),
            ),
          );
        const otherPaid = Number(paidRow?.total ?? 0);
        const available = Number((orderTotal - otherPaid).toFixed(2));

        if (requested > available) {
          throw new Error(`PAYMENT_EXCEEDS_AVAILABLE:${available.toFixed(2)}`);
        }

        // 4. Update payment
        const [updated] = await tx
          .update(payments)
          .set({
            amount: String(requested),
            date: new Date(`${String(date)}T12:00:00`),
            paymentType: String(paymentType),
            reference: String(reference ?? "") || null,
          })
          .where(and(eq(payments.id, Number(id)), isNull(payments.deletedAt)))
          .returning();

        // 5. Update account balance by delta
        const delta = requested - oldAmount;
        const [account] = await tx
          .select({ id: customerAccounts.id, balance: customerAccounts.balance })
          .from(customerAccounts)
          .where(eq(customerAccounts.customerId, Number(customerId)));

        if (account && delta !== 0) {
          await tx
            .update(customerAccounts)
            .set({
              balance: String(Number(account.balance) - delta),
              updatedAt: new Date(),
            })
            .where(eq(customerAccounts.id, account.id));

          await tx
            .update(accountMovements)
            .set({ amount: String(requested) })
            .where(
              and(
                eq(accountMovements.customerAccountId, account.id),
                eq(accountMovements.paymentId, Number(id)),
              ),
            );
        }

        return updated;
      });

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.UPDATE_CUSTOMER_PAYMENT);

      return { ...result, success: "Pago actualizado exitosamente." };
    } catch (error: any) {
      if (error?.message === "PAYMENT_NOT_FOUND") return { error: "El pago indicado no existe." };
      if (typeof error?.message === "string" && error.message.startsWith("PAYMENT_EXCEEDS_AVAILABLE:")) {
        const available = error.message.split(":")[1] ?? "0.00";
        return { error: `El pago excede el saldo pendiente. Disponible: Q${available}.` };
      }
      console.error("updateCustomerPayment error", error);
      return { error: "Error al actualizar el pago." };
    }
  },
);

// ---------------------------------------------------------------------------
// deleteCustomerPayment
// ---------------------------------------------------------------------------

const deleteCustomerPaymentSchema = z.object({
  id: z.union([z.string().min(1).transform(Number), z.number().int()]),
});

export const deleteCustomerPayment = validatedActionWithUser(
  deleteCustomerPaymentSchema,
  async (data, _, user) => {
    const { id } = data as any;

    try {
      await db.transaction(async (tx) => {
        const [payment] = await tx
          .select({
            id: payments.id,
            amount: payments.amount,
            customerId: payments.customerId,
          })
          .from(payments)
          .where(and(eq(payments.id, Number(id)), isNull(payments.deletedAt)));

        if (!payment) throw new Error("PAYMENT_NOT_FOUND");

        // Soft delete
        await tx
          .update(payments)
          .set({ deletedAt: new Date() })
          .where(eq(payments.id, Number(id)));

        // Restore balance (add back the amount as debt)
        const [account] = await tx
          .select({ id: customerAccounts.id, balance: customerAccounts.balance })
          .from(customerAccounts)
          .where(eq(customerAccounts.customerId, payment.customerId));

        if (account) {
          await tx
            .update(customerAccounts)
            .set({
              balance: String(Number(account.balance) + Number(payment.amount)),
              updatedAt: new Date(),
            })
            .where(eq(customerAccounts.id, account.id));
        }
      });

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.DELETE_CUSTOMER_PAYMENT);

      return { success: "Pago eliminado exitosamente." };
    } catch (error: any) {
      if (error?.message === "PAYMENT_NOT_FOUND") return { error: "El pago indicado no existe." };
      console.error("deleteCustomerPayment error", error);
      return { error: "Error al eliminar el pago." };
    }
  },
);

// ---------------------------------------------------------------------------
// confirmOrder
// ---------------------------------------------------------------------------

const confirmOrderSchema = z.object({
  id: z.string().min(1).transform(Number),
});

export const confirmOrder = validatedActionWithUser(
  confirmOrderSchema,
  async (data, _, user): Promise<ActionState> => {
    const { id: orderId } = data as any;
    try {
      await db.transaction(async (tx) => {
        const [order] = await tx
          .select({ status: customerOrders.status, customerId: customerOrders.customerId })
          .from(customerOrders)
          .where(eq(customerOrders.id, orderId));

        if (!order) throw new Error("ORDER_NOT_FOUND");
        if (order.status === "confirmed" || order.status === "paid") {
          throw new Error("ALREADY_CONFIRMED");
        }

        // Calculate order total
        const [totalRow] = await tx
          .select({
            total: sql<string>`COALESCE(SUM(${customerOrderDetails.quantity}::numeric * ${customerOrderDetails.price}::numeric), 0)`,
          })
          .from(customerOrderDetails)
          .where(
            and(
              eq(customerOrderDetails.orderId, orderId),
              isNull(customerOrderDetails.deletedAt),
            ),
          );
        const orderTotal = Number(totalRow?.total ?? 0);

        // Update order status
        await tx
          .update(customerOrders)
          .set({ status: "confirmed" })
          .where(eq(customerOrders.id, orderId));

        // Upsert customer account and insert DEBIT movement
        let [account] = await tx
          .select({ id: customerAccounts.id, balance: customerAccounts.balance })
          .from(customerAccounts)
          .where(eq(customerAccounts.customerId, order.customerId));

        if (!account) {
          const [inserted] = await tx
            .insert(customerAccounts)
            .values({ customerId: order.customerId, balance: "0" })
            .returning();
          account = inserted;
        }

        await tx
          .update(customerAccounts)
          .set({
            balance: String(Number(account.balance) + orderTotal),
            updatedAt: new Date(),
          })
          .where(eq(customerAccounts.id, account.id));

        await tx.insert(accountMovements).values({
          customerAccountId: account.id,
          type: "DEBIT",
          amount: String(orderTotal),
          orderId: orderId,
        });
      });

      return { success: "Venta confirmada exitosamente." };
    } catch (error: any) {
      if (error?.message === "ORDER_NOT_FOUND") return { error: "Venta no encontrada." };
      if (error?.message === "ALREADY_CONFIRMED") return { error: "La venta ya está confirmada o pagada." };
      console.error("confirmOrder error", error);
      return { error: "Error al confirmar la venta." };
    }
  },
);
