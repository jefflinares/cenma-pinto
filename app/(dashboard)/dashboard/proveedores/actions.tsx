"use server";
import { logActivity } from "@/app/(login)/actions";
import { validatedActionWithUser } from "@/lib/auth/middleware";
import { db } from "@/lib/db/drizzle";

import {
  ActivityType,
  income as incomeTable,
  providers,
  products as productsTable,
  incomeDetails as incomeDetailsTable,
} from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { extractProductsIds } from "./util";

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
      // Verify if there are no income associated with the supplier
      const associatedIncome = await db
        .select()
        .from(incomeTable)
        .where(eq(incomeTable.providerId, id))
        .limit(1);

      if (associatedIncome.length > 0) {
        throw new Error(
          "No se puede eliminar el proveedor porque tiene ingresos asociados."
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

const incomeSchema = z
  .object({
    date: z.string().min(1),
    providerId: z.string().min(1).transform(Number),
  })
  .passthrough(); // This allows extra fields to pass through

export const addIncome = validatedActionWithUser(
  incomeSchema,
  async (data, _, user) => {
    debugger;
    const { date, truckId, driverName, providerId, ...rest } = data;

    const products = extractProductsIds(rest);
    console.log("🚀 ~ addIncome products:", products);

    try {
      // Start a transaction to insert income and income details with products
      const result = await db.transaction(async (tx) => {
        // Insert the income record
        const [newIncome] = await tx
          .insert(incomeTable)
          .values({
            date,
            providerId,
          })
          .returning();

        // Insert product records if any
        if (products.length > 0) {
          await tx.insert(incomeDetailsTable).values(
            products.map((p) => ({
              incomeId: newIncome.id,
              productId: p.productId,
              quantity: String(p.quantity),
              remainingQuantity: String(p.quantity),
              price: "0",
              createdBy: user.id,
            }))
          );
        }

        return newIncome;
      });

      if (!result) {
        throw new Error("Failed to create income");
      }

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.CREATE_INCOME);
      return {
        ...result,
        date: result.date,
        success: "Ingreso creado correctamente",
      };
    } catch (error: any) {
      console.error("Error creating income:", error);
      if (error?.code === "23505") {
        return {
          error: `Ya existe un ingreso con la fecha "${date}".`,
          date,
        };
      }
      return {
        error:
          "Error al crear el ingreso. Por favor, inténtelo de nuevo." + error,
        truckId,
        driverName,
      };
    }
  }
);

const updateIncomeSchema = z
  .object({
    id: z.string().min(1).transform(Number),
    date: z.string().min(1),
    //.transform((date) => new Date(date)),
    providerId: z.string().min(1).transform(Number),
  })
  .passthrough(); // This allows extra fields to pass through

export const updateIncome = validatedActionWithUser(
  updateIncomeSchema,
  async (data, _, user) => {
    const { id, date, providerId, ...rest } = data;
    try {
      const products = extractProductsIds(rest);
      // Start a transaction to insert income and income details with products
      const result = await db.transaction(async (tx) => {
        const updatedIncome = await db
          .update(incomeTable)
          .set({
            date,
            providerId,
          })
          .where(eq(incomeTable.id, id))
          .returning();

        if (!updatedIncome) {
          throw new Error("Failed to update income");
        }
        // Get the products added in the incomeDetailsTable
        const incomeDetails = await tx
          .select()
          .from(incomeDetailsTable)
          .where(eq(incomeDetailsTable.incomeId, id));

        // Verify if there are new products that need to be added
        const existingProductIds = incomeDetails.map(
          (detail) => detail.productId
        );
        const productsQuery = await tx.select().from(productsTable);
        
        if (productsQuery.length !== existingProductIds.length) {
          const nonAddedProducts = productsQuery.filter(
            (p) => !existingProductIds.includes(p.id)
          );
          // We need to add new products instead of updating them
          if (nonAddedProducts.length > 0) {
            await tx.insert(incomeDetailsTable).values(
              nonAddedProducts.map((p) => ({
                incomeId: updatedIncome[0].id,
                productId: p.id,
                quantity: String(0),
                remainingQuantity: String(0),
                price: "0",
                createdBy: user.id,
              }))
            );
          }
        }
        // Update product records
        if (products.length > 0) {
          await Promise.all(
            products.map((p) =>
              tx
                .update(incomeDetailsTable)
                .set({
                  quantity: String(p.quantity),
                  remainingQuantity: String(p.quantity),
                  price: "0",
                  createdBy: user.id,
                })
                .where(
                  and(
                    eq(incomeDetailsTable.incomeId, updatedIncome[0].id),
                    eq(incomeDetailsTable.productId, p.productId)
                  )
                )
            )
          );
        }
        return updatedIncome;
      });

      const teamId = 1;
      await logActivity(teamId, user.id, ActivityType.UPDATE_INCOME);
      return {
        ...result,

        date: result[0].date,
        success: "Ingreso actualizado correctamente",
      };
    } catch (error) {
      console.error("Error updating income:", error);

      return {
        error:
          "Error al actualizar el ingreso. Por favor, inténtelo de nuevo." +
          error,
        date,
      };
    }
  }
);

const deleteIncomeSchema = z.object({
  id: z.string().min(1).transform(Number),
});

export const deleteIncome = validatedActionWithUser(
  deleteIncomeSchema,
  async (data, _, user) => {
    const { id } = data;
    try {
      const [income] = await db
        .update(incomeTable)
        .set({ deletedAt: sql`now()` })
        .where(eq(incomeTable.id, id))
        .returning();
      if (!income) {
        throw new Error("Failed to delete income");
      }
      return { id, success: "Ingreso eliminado correctamente" };
    } catch (error: any) {
      console.log("🚀 ~ error deleting income:", error);
      return {
        error:
          "Error al eliminar el ingreso. Por favor, inténtelo de nuevo." +
          error,
      };
    }
  }
);
