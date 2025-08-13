import { logActivity } from "@/app/(login)/actions";
import { validatedActionWithUser } from "@/lib/auth/middleware";
import { db } from "@/lib/db/drizzle";

import { ActivityType, providers } from "@/lib/db/schema";
import { z } from "zod";

// Define the supplier schema (adjust fields as needed)
const supplierSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const addSupplier = validatedActionWithUser(
  supplierSchema,
  async (data, _, user) => {
    const { name, phone, address } = data;
    try {
      const newSupplier = await db
        .insert(providers)
        .values({
          name,
          phone,
          address,
        })
        .returning();

      if (!newSupplier) {
        throw new Error("Failed to create supplier");
      }
      // TODO teamId should not be hardcoded
      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.CREATE_PROVIDER);
      return { newSupplier, success: "Proveedor creado correctamente" };
    } catch (error) {
      console.error("Error creating supplier:", error);

      return {
        error:
          "Error al crear el proveedor. Por favor, inténtelo de nuevo." + error,
        name,
      };
    }
  }
);

const updateSupplierSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const updateSupplier = validatedActionWithUser(
  updateSupplierSchema,
  async (data, _, user) => {
    const { id, name, phone, address } = data;
    try {
      const updatedSupplier = await db
        .update(providers)
        .set({
          name,
          phone,
          address,
        })
        .where({ id })
        .returning();

      if (!updatedSupplier) {
        throw new Error("Failed to update supplier");
      }

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.UPDATE_PROVIDER);
      return { updatedSupplier, success: "Proveedor actualizado correctamente" };
    } catch (error) {
      console.error("Error updating supplier:", error);

      return {
        error:
          "Error al actualizar el proveedor. Por favor, inténtelo de nuevo." + error,
        name,
      };
    }
  }
);
