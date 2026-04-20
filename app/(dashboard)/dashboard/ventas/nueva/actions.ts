"use server";
import { validatedActionWithUser, ActionState } from "@/lib/auth/middleware";
import z from "zod";

const orderSchema = z
  .object({
    customerId: z.string().min(1).transform(Number),
    date: z.string().min(1),
  })
  .passthrough();

export const addOrder = validatedActionWithUser(
  orderSchema,
  async (data, _, user): Promise<ActionState> => {
    console.log("🚀 ~ data addOrder:", data)
    try {
      return { success: "Order created successfully" };
    } catch (error) {
      return { error: "Failed to create order" };
    }
  }
);

const updateOrderSchema = z
  .object({
    id: z.string().min(1).transform(Number),
    customerId: z.string().min(1).transform(Number),
    date: z.string().min(1),
  })
  .passthrough();

export const updateOrder = validatedActionWithUser(
  updateOrderSchema,
  async (data, _, user): Promise<ActionState> => {
    try {
      return { success: "Order updated successfully" };
    } catch (error) {
      return { error: "Failed to update order" };
    }
  }
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