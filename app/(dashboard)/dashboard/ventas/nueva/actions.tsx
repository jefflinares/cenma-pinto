import { validatedActionWithUser } from "@/lib/auth/middleware";
import z from "zod";

const orderSchema = z
  .object({
    customerId: z.string().min(1).transform(Number),
    date: z.string().min(1),
  })
  .passthrough();

export const addOrder = validatedActionWithUser(
  orderSchema,
  async (data, _, user) => {
    try {
    } catch (error) {}
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
  async (data, _, user) => {
    try {
    } catch (error) {}
  }
);

const deleteOrderSchema = z.object({
  id: z.string().min(1).transform(Number),
});

export const deleteOrder = validatedActionWithUser(
  deleteOrderSchema,
  async (data, _, user) => {
    try {
    } catch (error) {}
  }
);