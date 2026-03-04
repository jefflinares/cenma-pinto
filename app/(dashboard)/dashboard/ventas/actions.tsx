"use server";
import { logActivity } from "@/app/(login)/actions";
import { validatedActionWithUser } from "@/lib/auth/middleware";
import { db } from "@/lib/db/drizzle";
import { ActivityType, customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export const addCustomer = validatedActionWithUser(
  customerSchema,
  async (data: any, _, user) => {
    console.log("🚀 ~ data addCustomer:", data);
    const { name, phone, address, email, error } = data || {};
    try {
      if (error) {
        throw new Error(
          "Datos inválidos. Por favor revisa el formulario: " + error
        );
      }
      const newCustomer = await db
        .insert(customers)
        .values({
          name,
          phone,
          address,
          email,
        })
        .returning();

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.CREATE_CUSTOMER);
      return {
        ...newCustomer,
        success: "Cliente agregado correctamente",
      };
    } catch (error) {
      console.error("Error adding customer:", error);

      return {
        error:
          "Error al agregar el cliente. Por favor, inténtelo de nuevo." + error,
        name,
      };
    }
  },
  "addCustomer"
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
  async (data: any, _, user) => {
    const { id, name, phone, address, email, error } = data || {};
    try {
      if (error) {
        throw new Error(
          "Datos inválidos. Por favor revisa el formulario: " + data?.error
        );
      }
      const updatedCustomer = await db
        .update(customers)
        .set({
          name,
          phone,
          address,
          email,
        })
        .where(eq(customers.id, id))
        .returning();

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.UPDATE_CUSTOMER);
      return {
        ...updatedCustomer,
        success: "Cliente actualizado correctamente",
      };
    } catch (error) {
      console.error("Error updating customer:", error);

      return {
        error:
          "Error al actualizar el cliente. Por favor, inténtelo de nuevo." +
          error,
        name,
      };
    }
  },
  "updateCustomer"
);

const deleteCustomerSchema = z.object({
  id: z.string().min(1).transform(Number),
});

export const deleteCustomer = validatedActionWithUser(
  deleteCustomerSchema,
  async (data: any, _, user) => {
    const { id, error } = data;
    try {
      if (error) {
        throw new Error(
          "Datos inválidos. Por favor revisa el formulario: " + error
        );
      }
      await db.delete(customers).where(eq(customers.id, id));
      // TODO verifiy if customer does not have orders made
      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.DELETE_CUSTOMER);
      return {
        success: "Cliente eliminado correctamente",
      };
    } catch (error) {
      console.error("Error deleting customer:", error);

      return {
        error:
          "Error al eliminar el cliente. Por favor, inténtelo de nuevo." +
          error,
      };
    }
  },
  "deleteCustomer"
);
