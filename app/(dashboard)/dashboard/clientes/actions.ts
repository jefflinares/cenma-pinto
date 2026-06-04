"use server";
import { logActivity } from "@/app/(login)/actions";
import { validatedActionWithUser } from "@/lib/auth/middleware";
import { db } from "@/lib/db/drizzle";
import { ActivityType, customers, customerAccounts } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";

const addCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export const addCustomer = validatedActionWithUser(
  addCustomerSchema,
  async (data, _, user) => {
    const { name, phone, address, email } = data;
    try {
      const newCustomer = await db.transaction(async (tx) => {
        const [customer] = await tx
          .insert(customers)
          .values({ name, phone, address, email })
          .returning();

        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        await tx.insert(customerAccounts).values({
          customerId: customer.id,
          periodStart,
          periodEnd,
          balance: "0",
        });

        return customer;
      });

      await logActivity(1, user.id, ActivityType.CREATE_CUSTOMER);
      return { ...newCustomer, success: "Cliente agregado correctamente" };
    } catch (error) {
      console.error("Error adding customer:", error);
      return { error: "Error al agregar el cliente. Por favor, inténtelo de nuevo.", name };
    }
  },
);

const updateCustomerSchema = z.object({
  id: z.string().min(1).transform(Number),
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export const updateCustomer = validatedActionWithUser(
  updateCustomerSchema,
  async (data, _, user) => {
    const { id, name, phone, address, email } = data;
    try {
      const [updatedCustomer] = await db
        .update(customers)
        .set({ name, phone, address, email, updatedAt: sql`now()` })
        .where(eq(customers.id, id))
        .returning();

      if (!updatedCustomer) throw new Error("Customer not found");

      await logActivity(1, user.id, ActivityType.UPDATE_CUSTOMER);
      return { ...updatedCustomer, success: "Cliente actualizado correctamente" };
    } catch (error) {
      console.error("Error updating customer:", error);
      return { error: "Error al actualizar el cliente. Por favor, inténtelo de nuevo.", name };
    }
  },
);

const deleteCustomerSchema = z.object({
  id: z.string().min(1).transform(Number),
});

export const deleteCustomer = validatedActionWithUser(
  deleteCustomerSchema,
  async (data, _, user) => {
    const { id } = data;
    try {
      // TODO: validate customer has no registered purchases before deleting
      const [deleted] = await db
        .update(customers)
        .set({ deletedAt: sql`now()` })
        .where(eq(customers.id, id))
        .returning();

      if (!deleted) throw new Error("Customer not found");

      await logActivity(1, user.id, ActivityType.DELETE_CUSTOMER);
      return { success: "Cliente eliminado correctamente" };
    } catch (error) {
      console.error("Error deleting customer:", error);
      return { error: "Error al eliminar el cliente. Por favor, inténtelo de nuevo." };
    }
  },
);
