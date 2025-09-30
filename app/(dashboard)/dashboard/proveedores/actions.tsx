"use server";
import { logActivity } from "@/app/(login)/actions";
import { validatedActionWithUser } from "@/lib/auth/middleware";
import { db } from "@/lib/db/drizzle";

import { ActivityType, providers, trucks } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
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
      return { ...newSupplier, success: "Proveedor creado correctamente" };
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
  id: z.string().min(1).transform(Number),
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
        .where(eq(providers.id, Number(id)))
        .returning();

      if (!updatedSupplier) {
        throw new Error("Failed to update supplier");
      }

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.UPDATE_PROVIDER);
      return {
        ...updatedSupplier,
        success: "Proveedor actualizado correctamente",
      };
    } catch (error) {
      console.error("Error updating supplier:", error);

      return {
        error:
          "Error al actualizar el proveedor. Por favor, inténtelo de nuevo." +
          error,
        name,
      };
    }
  }
);

const deleteSupplierSchema = z.object({
  id: z.string().min(1).transform(Number),
});

export const deleteSupplier = validatedActionWithUser(
  deleteSupplierSchema,
  async (data, _, user) => {
    const { id } = data;
    try {
      // Verify if there are no trucks associated with the supplier
      const associatedTrucks = await db
        .select()
        .from(trucks)
        .where(eq(trucks.ownerId, id))
        .limit(1);

      if (associatedTrucks.length > 0) {
        throw new Error(
          "No se puede eliminar el proveedor porque tiene camiones asociados."
        );
      }
      const [supplier] = await db
        .update(providers)
        .set({ deletedAt: sql`now()` })
        .where(eq(providers.id, id))
        .returning();
      if (!supplier) {
        throw new Error("Failed to delete supplier");
      }
      return { id, success: "Proveedor eliminado correctamente" };
    } catch (error: any) {
      console.log("🚀 ~ error deleting supplier:", error);
      return {
        error:
          "Error al eliminar el proveedor. Por favor, inténtelo de nuevo." +
          error,
      };
    }
  }
);


const truckSchema = z.object({
  plate: z.string().min(1),
  ownerId: z.string().min(1).transform(Number),
});

export const addTruck = validatedActionWithUser(
  truckSchema,
  async (data, _, user) => {
    const { plate, ownerId } = data;
    console.log("🚀 ~ data:", data)
    try {
      const newTruck = await db
        .insert(trucks)
        .values({
          plate,
          ownerId,
        })
        .returning();

      if (!newTruck) {
        throw new Error("Failed to create truck");
      }
      // TODO teamId should not be hardcoded
      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.CREATE_TRUCK);
      return { ...newTruck, success: "Camión creado correctamente" };
    } catch (error: any) {
      console.error("Error creating truck:", error);
      if (error?.code === '23505') { // Unique violation error code for PostgreSQL
        return {
          error: `Ya existe un camión con la placa "${plate}".`,
          plate,
        };
      }
      return {
        error:
          "Error al crear el camión. Por favor, inténtelo de nuevo." + error,
        plate,
      };
    }
  }
);


const updateTruckSchema = z.object({
  id: z.string().min(1).transform(Number),
  plate: z.string().min(1),
  ownerId: z.string().min(1).transform(Number),
});

export const updateTruck = validatedActionWithUser(
  updateTruckSchema,
  async (data, _, user) => {
    console.log("🚀 ~ updateTruck data:", data)
    const { id, plate, ownerId } = data;
    try {
      const updatedTruck = await db
        .update(trucks)
        .set({
          plate,
          ownerId,
        })
        .where(eq(trucks.id, id))
        .returning();

      if (!updatedTruck) {
        throw new Error("Failed to update truck");
      }

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.UPDATE_TRUCK);
      return {
        ...updatedTruck,
        success: "Camión actualizado correctamente",
      };
    } catch (error) {
      console.error("Error updating truck:", error);

      return {
        error:
          "Error al actualizar el camión. Por favor, inténtelo de nuevo." +
          error,
        plate,
      };
    }
  }
);

const deleteTruckSchema = z.object({
  id: z.string().min(1).transform(Number),
});

export const deleteTruck = validatedActionWithUser(
  deleteTruckSchema,
  async (data, _, user) => {
    const { id } = data;
    try {
      

      const [truck] = await db
        .update(trucks)
        .set({ deletedAt: sql`now()` })
        .where(eq(trucks.id, id))
        .returning();
      if (!truck) {
        throw new Error("Failed to delete truck");
      }
      return { id, success: "Camión eliminado correctamente" };
    } catch (error: any) {
      console.log("🚀 ~ error deleting truck:", error);
      return {
        error:
          "Error al eliminar el camión. Por favor, inténtelo de nuevo." +
          error,
      };
    }
  }
);