"use server";

import { logActivity } from "@/app/(login)/actions";
import { validatedActionWithUser } from "@/lib/auth/middleware";
import { db } from "@/lib/db/drizzle";
import {
  ActivityType,
  accountMovements,
  cashDaySummary,
  cashMovements,
  customerAccounts,
  customerOrderDetails,
  customerOrders,
  payments,
} from "@/lib/db/schema";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import z from "zod";

// ---------------------------------------------------------------------------
// openCashDay
// ---------------------------------------------------------------------------

const openCashDaySchema = z.object({
  date: z.string().min(1),
  openingBalance: z.union([z.string().min(1).transform(Number), z.number()]),
});

export const openCashDay = validatedActionWithUser(
  openCashDaySchema,
  async (data, _, user) => {
    const { date, openingBalance } = data as any;
    try {
      const balance = Number(openingBalance);
      if (Number.isNaN(balance) || balance < 0) {
        return { error: "El saldo inicial debe ser un número válido." };
      }

      // Check if already opened
      const [existing] = await db
        .select({ id: cashDaySummary.id })
        .from(cashDaySummary)
        .where(eq(cashDaySummary.date, String(date)))
        .limit(1);

      if (existing) {
        return { error: "Ya existe una apertura de caja para esta fecha." };
      }

      await db.transaction(async (tx) => {
        await tx.insert(cashDaySummary).values({
          date: String(date),
          openingBalance: String(balance),
        });

        await tx.insert(cashMovements).values({
          concept: "Apertura de caja",
          type: "INITIAL",
          amount: String(balance),
          date: new Date(`${date}T08:00:00`),
        });
      });

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.CREATE_CASH_MOVEMENT);

      return { success: "Caja abierta exitosamente." };
    } catch (error) {
      console.error("openCashDay error", error);
      return { error: "Error al abrir la caja." };
    }
  },
);

// ---------------------------------------------------------------------------
// closeCashDay
// ---------------------------------------------------------------------------

const closeCashDaySchema = z.object({
  date: z.string().min(1),
});

export const closeCashDay = validatedActionWithUser(
  closeCashDaySchema,
  async (data, _, user) => {
    const { date } = data as any;
    try {
      const [summary] = await db
        .select()
        .from(cashDaySummary)
        .where(eq(cashDaySummary.date, String(date)))
        .limit(1);

      if (!summary) return { error: "No se encontró apertura de caja para esta fecha." };
      if (summary.closedAt) return { error: "La caja ya fue cerrada." };

      const start = new Date(`${date}T00:00:00`);
      const end = new Date(`${date}T23:59:59`);

      const [incomeRow] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${cashMovements.amount}::numeric), 0)`,
        })
        .from(cashMovements)
        .where(
          and(
            eq(cashMovements.type, "INCOME"),
            sql`${cashMovements.date} >= ${start}`,
            sql`${cashMovements.date} <= ${end}`,
          ),
        );

      const [expenseRow] = await db
        .select({
          total: sql<string>`COALESCE(SUM(${cashMovements.amount}::numeric), 0)`,
        })
        .from(cashMovements)
        .where(
          and(
            eq(cashMovements.type, "EXPENSE"),
            sql`${cashMovements.date} >= ${start}`,
            sql`${cashMovements.date} <= ${end}`,
          ),
        );

      const opening = Number(summary.openingBalance);
      const income = Number(incomeRow?.total ?? 0);
      const expense = Number(expenseRow?.total ?? 0);
      const closing = Number((opening + income - expense).toFixed(2));

      await db
        .update(cashDaySummary)
        .set({
          closingBalance: String(closing),
          closedAt: new Date(),
          closedBy: user.id,
        })
        .where(eq(cashDaySummary.id, summary.id));

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.UPDATE_CASH_MOVEMENT);

      return { success: `Caja cerrada. Saldo final: Q${closing.toFixed(2)}` };
    } catch (error) {
      console.error("closeCashDay error", error);
      return { error: "Error al cerrar la caja." };
    }
  },
);

// ---------------------------------------------------------------------------
// addCashWithdrawal
// ---------------------------------------------------------------------------

const addCashWithdrawalSchema = z.object({
  concept: z.string().min(1),
  amount: z.union([z.string().min(1).transform(Number), z.number()]),
  date: z.string().min(1),
});

export const addCashWithdrawal = validatedActionWithUser(
  addCashWithdrawalSchema,
  async (data, _, user) => {
    const { concept, amount, date } = data as any;
    try {
      const value = Number(amount);
      if (Number.isNaN(value) || value <= 0) {
        return { error: "El monto debe ser mayor a cero." };
      }

      await db.insert(cashMovements).values({
        concept: String(concept),
        type: "EXPENSE",
        amount: String(value),
        date: new Date(`${date}T12:00:00`),
      });

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.CREATE_CASH_MOVEMENT);

      return { success: "Retiro registrado exitosamente." };
    } catch (error) {
      console.error("addCashWithdrawal error", error);
      return { error: "Error al registrar el retiro." };
    }
  },
);

// ---------------------------------------------------------------------------
// addCobro — register a customer payment distributed across oldest orders
// ---------------------------------------------------------------------------

const addCobroSchema = z.object({
  customerId: z.union([z.string().min(1).transform(Number), z.number().int()]),
  totalAmount: z.union([z.string().min(1).transform(Number), z.number()]),
  paymentType: z.string().min(1),
  date: z.string().min(1),
  reference: z.string().optional(),
});

export const addCobro = validatedActionWithUser(
  addCobroSchema,
  async (data, _, user) => {
    const { customerId, totalAmount, paymentType, date, reference } = data as any;

    try {
      const total = Number(Number(totalAmount).toFixed(2));
      if (!total || total <= 0) {
        return { error: "El monto debe ser mayor a cero." };
      }

      const result = await db.transaction(async (tx) => {
        // 1. Get all confirmed orders for the customer, oldest first
        const orders = await tx
          .select({ id: customerOrders.id, date: customerOrders.date })
          .from(customerOrders)
          .where(
            and(
              eq(customerOrders.customerId, Number(customerId)),
              eq(customerOrders.status, "confirmed"),
              isNull(customerOrders.deletedAt),
            ),
          )
          .orderBy(asc(customerOrders.date));

        if (orders.length === 0) {
          throw new Error("NO_CONFIRMED_ORDERS");
        }

        // 2. Distribute payment oldest-first
        let remaining = total;
        const createdPayments: { id: number; orderId: number; amount: number }[] = [];

        for (const order of orders) {
          if (remaining <= 0) break;

          // Calculate order total
          const [totalRow] = await tx
            .select({
              total: sql<string>`COALESCE(SUM(${customerOrderDetails.quantity}::numeric * ${customerOrderDetails.price}::numeric), 0)`,
            })
            .from(customerOrderDetails)
            .where(
              and(
                eq(customerOrderDetails.orderId, order.id),
                isNull(customerOrderDetails.deletedAt),
              ),
            );
          const orderTotal = Number(totalRow?.total ?? 0);

          // Sum existing payments for this order
          const [paidRow] = await tx
            .select({
              total: sql<string>`COALESCE(SUM(${payments.amount}::numeric), 0)`,
            })
            .from(payments)
            .where(and(eq(payments.orderId, order.id), isNull(payments.deletedAt)));
          const alreadyPaid = Number(paidRow?.total ?? 0);

          const orderRemaining = Number((orderTotal - alreadyPaid).toFixed(2));
          if (orderRemaining <= 0) continue;

          const applied = Number(Math.min(remaining, orderRemaining).toFixed(2));

          const [newPayment] = await tx
            .insert(payments)
            .values({
              customerId: Number(customerId),
              orderId: order.id,
              date: new Date(`${date}T12:00:00`),
              amount: String(applied),
              paymentType: String(paymentType),
              reference: String(reference ?? "") || null,
              createdBy: user.id,
            })
            .returning();

          createdPayments.push({ id: newPayment.id, orderId: order.id, amount: applied });
          remaining = Number((remaining - applied).toFixed(2));

          // Mark order as paid if fully covered
          if (Number((orderRemaining - applied).toFixed(2)) <= 0) {
            await tx
              .update(customerOrders)
              .set({ status: "paid" })
              .where(eq(customerOrders.id, order.id));
          }
        }

        if (createdPayments.length === 0) {
          throw new Error("NO_PENDING_BALANCE");
        }

        const actualApplied = Number((total - remaining).toFixed(2));

        // 3. Update customer account balance
        let [account] = await tx
          .select({ id: customerAccounts.id, balance: customerAccounts.balance })
          .from(customerAccounts)
          .where(eq(customerAccounts.customerId, Number(customerId)));

        if (!account) {
          const [inserted] = await tx
            .insert(customerAccounts)
            .values({ customerId: Number(customerId), balance: "0" })
            .returning();
          account = inserted;
        }

        await tx
          .update(customerAccounts)
          .set({
            balance: String(Number(account.balance) - actualApplied),
            updatedAt: new Date(),
          })
          .where(eq(customerAccounts.id, account.id));

        // 4. Insert CREDIT account movements for each payment
        for (const p of createdPayments) {
          await tx.insert(accountMovements).values({
            customerAccountId: account.id,
            type: "CREDIT",
            amount: String(p.amount),
            orderId: p.orderId,
            paymentId: p.id,
          });
        }

        // 5. If cash payment → insert INCOME cash movement
        if (String(paymentType) === "cash" && createdPayments.length > 0) {
          await tx.insert(cashMovements).values({
            concept: `Cobro cliente #${customerId}`,
            type: "INCOME",
            amount: String(actualApplied),
            date: new Date(`${date}T12:00:00`),
            paymentId: createdPayments[0].id,
          });
        }

        return { paymentsCreated: createdPayments.length, applied: actualApplied };
      });

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.CREATE_CUSTOMER_PAYMENT);

      return { ...result, success: "Cobro registrado exitosamente." };
    } catch (error: any) {
      if (error?.message === "NO_CONFIRMED_ORDERS") {
        return { error: "El cliente no tiene ventas confirmadas pendientes de pago." };
      }
      if (error?.message === "NO_PENDING_BALANCE") {
        return { error: "El cliente no tiene saldo pendiente." };
      }
      console.error("addCobro error", error);
      return { error: "Error al registrar el cobro." };
    }
  },
);
