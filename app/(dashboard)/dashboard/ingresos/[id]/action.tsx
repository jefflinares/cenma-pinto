"use server";
import { logActivity } from "@/app/(login)/actions";
import { validatedActionWithUser, ActionState } from "@/lib/auth/middleware";
import { db } from "@/lib/db/drizzle";
import {
  ActivityType,
  customerOrders,
  customerOrderDetails,
  incomeDetails,
  products as productsTable,
} from "@/lib/db/schema";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";

const productItemSchema = z.object({
  id: z.string().min(1),
  salePrice: z.string(),
  amount: z.string().min(1),
});

const addOrderSchema = z.object({
  customerId: z.string().min(1).transform(Number),
  date: z.string().min(1),
  incomeId: z.string().min(1).transform(Number),
  products: z.array(productItemSchema).min(1),
});

export const addOrder = validatedActionWithUser(
  addOrderSchema,
  async (data, _, user): Promise<ActionState> => {
    const { customerId, date, incomeId, products: items } = data;

    try {
      await db.transaction(async (tx) => {
        // 1. Create the order header
        const [order] = await tx
          .insert(customerOrders)
          .values({ customerId, incomeId, date: new Date(date), createdBy: user.id })
          .returning();

        const productIds = items.map((p) => Number(p.id));

        // 2. Fetch incomeDetails for this income (to get incomeDetailId + remainingQuantity)
        const detailsList = await tx
          .select()
          .from(incomeDetails)
          .where(
            and(
              eq(incomeDetails.incomeId, incomeId),
              inArray(incomeDetails.productId, productIds),
            ),
          );

        // 3. Fetch products to get containerId
        const productsList = await tx
          .select()
          .from(productsTable)
          .where(inArray(productsTable.id, productIds));

        // 4. Insert order details + decrement remainingQuantity
        for (const item of items) {
          const productId = Number(item.id);
          const quantity = Number(item.amount);
          const price = item.salePrice || "0";

          const detail = detailsList.find((d) => d.productId === productId);
          if (!detail) {
            throw new Error(`Detalle de ingreso no encontrado para el producto ${productId}`);
          }

          const product = productsList.find((p) => p.id === productId);
          if (!product) {
            throw new Error(`Producto no encontrado: ${productId}`);
          }
          if (!product.container) {
            throw new Error(`El producto ${product.id} no tiene envase asignado`);
          }

          const remaining = Number(detail.remainingQuantity ?? detail.quantity);
          if (quantity > remaining) {
            throw new Error(
              `La cantidad (${quantity}) excede el stock disponible (${remaining}) para el producto ${productId}`,
            );
          }

          await tx.insert(customerOrderDetails).values({
            orderId: order.id,
            productId,
            containerId: product.container,
            incomeDetailId: detail.id,
            quantity,
            price,
          });

          await tx
            .update(incomeDetails)
            .set({ remainingQuantity: remaining - quantity })
            .where(eq(incomeDetails.id, detail.id));
        }
      });

      await logActivity(1, user.id, ActivityType.CREATE_ORDER);
      return { success: "Venta registrada correctamente" };
    } catch (error: any) {
      console.error("Error creating order:", error);
      return { error: error?.message ?? "Error al registrar la venta. Por favor, inténtelo de nuevo." };
    }
  }
);

const updateOrderSchema = z.object({
  id: z.string().min(1).transform(Number),
  customerId: z.string().min(1).transform(Number),
  date: z.string().min(1),
  incomeId: z.string().min(1).transform(Number),
  products: z.array(productItemSchema).min(1),
});

export const updateOrder = validatedActionWithUser(
  updateOrderSchema,
  async (data, _, user): Promise<ActionState> => {
    const { id: orderId, customerId, date, incomeId, products: items } = data;

    try {
      await db.transaction(async (tx) => {
        // 1. Verify the order exists and belongs to this income
        const [existingOrder] = await tx
          .select()
          .from(customerOrders)
          .where(and(eq(customerOrders.id, orderId), isNull(customerOrders.deletedAt)));

        if (!existingOrder) throw new Error("Orden no encontrada");
        if (existingOrder.incomeId !== incomeId) {
          throw new Error("La orden no pertenece al ingreso indicado");
        }

        // 2. Fetch existing (non-deleted) order details to restore remainingQuantity
        const existingDetails = await tx
          .select()
          .from(customerOrderDetails)
          .where(
            and(
              eq(customerOrderDetails.orderId, orderId),
              isNull(customerOrderDetails.deletedAt),
            ),
          );

        // 3. Restore remainingQuantity for each existing detail
        for (const old of existingDetails) {
          await tx
            .update(incomeDetails)
            .set({
              remainingQuantity: sql`${incomeDetails.remainingQuantity} + ${old.quantity}`,
            })
            .where(eq(incomeDetails.id, old.incomeDetailId));
        }

        // 4. Soft-delete all existing order details
        await tx
          .update(customerOrderDetails)
          .set({ deletedAt: sql`now()` })
          .where(
            and(
              eq(customerOrderDetails.orderId, orderId),
              isNull(customerOrderDetails.deletedAt),
            ),
          );

        // 5. Update order header
        await tx
          .update(customerOrders)
          .set({ customerId, incomeId, date: new Date(date), updatedAt: sql`now()` })
          .where(eq(customerOrders.id, orderId));

        const productIds = items.map((p) => Number(p.id));

        // 6. Fetch incomeDetails and products for the new items
        const detailsList = await tx
          .select()
          .from(incomeDetails)
          .where(
            and(
              eq(incomeDetails.incomeId, incomeId),
              inArray(incomeDetails.productId, productIds),
            ),
          );

        const productsList = await tx
          .select()
          .from(productsTable)
          .where(inArray(productsTable.id, productIds));

        // 7. Insert new order details + decrement remainingQuantity
        for (const item of items) {
          const productId = Number(item.id);
          const quantity = Number(item.amount);
          const price = item.salePrice || "0";

          const detail = detailsList.find((d) => d.productId === productId);
          if (!detail) {
            throw new Error(`Detalle de ingreso no encontrado para el producto ${productId}`);
          }

          const product = productsList.find((p) => p.id === productId);
          if (!product) throw new Error(`Producto no encontrado: ${productId}`);
          if (!product.container) {
            throw new Error(`El producto ${product.id} no tiene envase asignado`);
          }

          // remainingQuantity was already restored in step 3, so read the fresh value
          const freshDetail = await tx
            .select({ remainingQuantity: incomeDetails.remainingQuantity, quantity: incomeDetails.quantity })
            .from(incomeDetails)
            .where(eq(incomeDetails.id, detail.id))
            .then((r) => r[0]);

          const remaining = Number(freshDetail?.remainingQuantity ?? freshDetail?.quantity ?? 0);
          if (quantity > remaining) {
            throw new Error(
              `La cantidad (${quantity}) excede el stock disponible (${remaining}) para el producto ${productId}`,
            );
          }

          await tx.insert(customerOrderDetails).values({
            orderId,
            productId,
            containerId: product.container,
            incomeDetailId: detail.id,
            quantity,
            price,
          });

          await tx
            .update(incomeDetails)
            .set({ remainingQuantity: remaining - quantity })
            .where(eq(incomeDetails.id, detail.id));
        }
      });

      await logActivity(1, user.id, ActivityType.UPDATE_ORDER);
      return { success: "Venta actualizada correctamente" };
    } catch (error: any) {
      console.error("Error updating order:", error);
      return { error: error?.message ?? "Error al actualizar la venta. Por favor, inténtelo de nuevo." };
    }
  }
);

const deleteOrderSchema = z.object({
  id: z.string().min(1).transform(Number),
});

export const deleteOrder = validatedActionWithUser(
  deleteOrderSchema,
  async (data, _, user): Promise<ActionState> => {
    const { id: orderId } = data;
    try {
      await db.transaction(async (tx) => {
        // Restore remainingQuantity for each consumed detail
        const existingDetails = await tx
          .select()
          .from(customerOrderDetails)
          .where(
            and(
              eq(customerOrderDetails.orderId, orderId),
              isNull(customerOrderDetails.deletedAt),
            ),
          );

        for (const detail of existingDetails) {
          await tx
            .update(incomeDetails)
            .set({
              remainingQuantity: sql`${incomeDetails.remainingQuantity} + ${detail.quantity}`,
            })
            .where(eq(incomeDetails.id, detail.incomeDetailId));
        }

        await tx
          .update(customerOrderDetails)
          .set({ deletedAt: sql`now()` })
          .where(
            and(
              eq(customerOrderDetails.orderId, orderId),
              isNull(customerOrderDetails.deletedAt),
            ),
          );

        await tx
          .update(customerOrders)
          .set({ deletedAt: sql`now()` })
          .where(eq(customerOrders.id, orderId));
      });

      await logActivity(1, user.id, ActivityType.DELETE_ORDER);
      return { success: "Venta eliminada correctamente" };
    } catch (error: any) {
      console.error("Error deleting order:", error);
      return { error: error?.message ?? "Error al eliminar la venta. Por favor, inténtelo de nuevo." };
    }
  }
);
