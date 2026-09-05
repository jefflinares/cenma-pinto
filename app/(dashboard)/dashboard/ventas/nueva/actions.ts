"use server";
import { validatedActionWithUser, ActionState } from "@/lib/auth/middleware";
import z from "zod";
import { db } from "@/lib/db/drizzle";
import {
  accountMovements,
  customerAccounts,
  customerOrderDetails,
  customerOrders,
  incomeDetails,
} from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

const orderDetailSchema = z.object({
  id: z.number(),
  productId: z.number(),
  containerId: z.number().nullable().optional(),
  quantity: z.number(),
  unitPrice: z.number().optional(),
  stock: z.number().optional(),
});

const orderSchema = z
  .object({
    customerId: z.string().min(1).transform(Number),
    date: z.string().min(1),
    incomeId: z.string().min(1).transform(Number),
    orderDetails: z.array(orderDetailSchema),
  })
  .passthrough();

export const addOrder = validatedActionWithUser(
  orderSchema,
  async (data, _, user): Promise<ActionState> => {
    try {
      const details = data.orderDetails;

      const activeDetails = details.filter((d) => Number(d.quantity) > 0 && Number(d.unitPrice ?? 0) > 0);
      if (activeDetails.length === 0) {
        return { error: "Debe ingresar al menos un producto con cantidad y precio" };
      }

      const orderTotal = activeDetails.reduce(
        (sum, d) => sum + Number(d.quantity) * Number(d.unitPrice ?? 0),
        0,
      );

      const result = await db.transaction(async (tx) => {
        const [order] = await tx
          .insert(customerOrders)
          .values({
            customerId: data.customerId as number,
            incomeId: data.incomeId as number,
            date: new Date(),
            createdBy: user.id,
          })
          .returning({ id: customerOrders.id });

        await tx.insert(customerOrderDetails).values(
          activeDetails.map((d) => ({
            orderId: order.id,
            productId: d.productId,
            containerId: d.containerId ?? 1,
            incomeDetailId: d.id,
            quantity: Number(d.quantity),
            price: String(d.unitPrice ?? 0),
          })),
        );

        // Discount remainingQuantity for each incomeDetail
        for (const d of activeDetails) {
          await tx
            .update(incomeDetails)
            .set({
              remainingQuantity: Math.max(0, (d as any).stock - Number(d.quantity)),
            })
            .where(eq(incomeDetails.id, d.id));
        }

        // Upsert customer account and record DEBIT movement
        const [existingAccount] = await tx
          .select({ id: customerAccounts.id, balance: customerAccounts.balance })
          .from(customerAccounts)
          .where(eq(customerAccounts.customerId, data.customerId as number));

        let accountId: number;
        if (existingAccount) {
          await tx
            .update(customerAccounts)
            .set({
              balance: String(Number(existingAccount.balance) + orderTotal),
              updatedAt: new Date(),
            })
            .where(eq(customerAccounts.id, existingAccount.id));
          accountId = existingAccount.id;
        } else {
          const [newAccount] = await tx
            .insert(customerAccounts)
            .values({
              customerId: data.customerId as number,
              balance: String(orderTotal),
              updatedAt: new Date(),
            })
            .returning({ id: customerAccounts.id });
          accountId = newAccount.id;
        }

        await tx.insert(accountMovements).values({
          customerAccountId: accountId,
          type: "DEBIT",
          amount: String(orderTotal),
          orderId: order.id,
        });

        return order;
      });

      return { success: "Venta registrada correctamente", id: result.id } as ActionState & { id: number };
    } catch (error) {
      console.error("Error creating order:", error);
      return { error: "Error al registrar la venta" };
    }
  }
);

const updateOrderDetailSchema = z.object({
  id: z.number(),
  productId: z.number(),
  containerId: z.number().nullable().optional(),
  quantity: z.number(),
  unitPrice: z.number().optional(),
  stock: z.number().optional(),
});

const updateOrderSchema = z
  .object({
    id: z.string().min(1).transform(Number),
    customerId: z.string().min(1).transform(Number),
    date: z.string().min(1),
    orderDetails: z.array(updateOrderDetailSchema).default([]),
  })
  .passthrough();

export const updateOrder = validatedActionWithUser(
  updateOrderSchema,
  async (data, _, user): Promise<ActionState> => {
    try {
      const { id: orderId, customerId, orderDetails } = data as any;

      await db.transaction(async (tx) => {
        // 1. Validate order is editable
        const [existing] = await tx
          .select({ status: customerOrders.status })
          .from(customerOrders)
          .where(eq(customerOrders.id, orderId));

        if (!existing) throw new Error("ORDER_NOT_FOUND");
        if (existing.status === "confirmed" || existing.status === "paid") {
          throw new Error("ORDER_LOCKED");
        }

        if (!orderDetails || orderDetails.length === 0) return;

        const activeDetails = orderDetails.filter(
          (d: any) => Number(d.quantity) > 0 && Number(d.unitPrice ?? 0) > 0,
        );

        // 2. Load current customerOrderDetails
        const currentDetails = await tx
          .select({
            id: customerOrderDetails.id,
            incomeDetailId: customerOrderDetails.incomeDetailId,
            quantity: customerOrderDetails.quantity,
            price: customerOrderDetails.price,
          })
          .from(customerOrderDetails)
          .where(
            and(
              eq(customerOrderDetails.orderId, orderId),
              isNull(customerOrderDetails.deletedAt),
            ),
          );

        // 3. Compute old total
        const oldTotal = currentDetails.reduce(
          (sum, d) => sum + Number(d.quantity) * Number(d.price),
          0,
        );

        // 4. Update each active detail and adjust incomeDetail remainingQuantity
        for (const row of activeDetails) {
          const current = currentDetails.find((d) => d.incomeDetailId === row.id);
          if (!current) continue;

          const oldQty = Number(current.quantity);
          const newQty = Number(row.quantity);
          const newPrice = Number(row.unitPrice ?? 0);

          await tx
            .update(customerOrderDetails)
            .set({ quantity: newQty, price: String(newPrice) })
            .where(eq(customerOrderDetails.id, current.id));

          // Adjust incomeDetail remainingQuantity: restore old, apply new
          const [incomeDetail] = await tx
            .select({ remainingQuantity: incomeDetails.remainingQuantity })
            .from(incomeDetails)
            .where(eq(incomeDetails.id, row.id));

          if (incomeDetail) {
            const newRemaining = Math.max(
              0,
              (incomeDetail.remainingQuantity ?? 0) + oldQty - newQty,
            );
            await tx
              .update(incomeDetails)
              .set({ remainingQuantity: newRemaining })
              .where(eq(incomeDetails.id, row.id));
          }
        }

        // 5. Compute new total and delta
        const newTotal = activeDetails.reduce(
          (sum: number, d: any) => sum + Number(d.quantity) * Number(d.unitPrice ?? 0),
          0,
        );
        const delta = newTotal - oldTotal;

        // 6. Update customer account balance
        if (delta !== 0) {
          const [account] = await tx
            .select({ id: customerAccounts.id, balance: customerAccounts.balance })
            .from(customerAccounts)
            .where(eq(customerAccounts.customerId, Number(customerId)));

          if (account) {
            await tx
              .update(customerAccounts)
              .set({
                balance: String(Number(account.balance) + delta),
                updatedAt: new Date(),
              })
              .where(eq(customerAccounts.id, account.id));

            // 7. Record adjustment movement
            await tx.insert(accountMovements).values({
              customerAccountId: account.id,
              type: delta > 0 ? "DEBIT" : "CREDIT",
              amount: String(Math.abs(delta)),
              orderId: orderId,
            });
          }
        }
      });

      return { success: "Venta actualizada correctamente" };
    } catch (error: any) {
      if (error?.message === "ORDER_NOT_FOUND") return { error: "Venta no encontrada" };
      if (error?.message === "ORDER_LOCKED")
        return { error: "No se puede editar una venta confirmada o pagada" };
      console.error("Error updating order:", error);
      return { error: "Error al actualizar la venta" };
    }
  },
);

const deleteOrderSchema = z.object({
  id: z.string().min(1).transform(Number),
});

export const deleteOrder = validatedActionWithUser(
  deleteOrderSchema,
  async (data, _, user): Promise<ActionState> => {
    try {
      return { success: "Order deleted successfully" };
    } catch (error) {
      return { error: "Failed to delete order" };
    }
  }
);