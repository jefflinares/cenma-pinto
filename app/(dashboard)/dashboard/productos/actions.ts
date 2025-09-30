"use server";

import { z } from "zod";
import { db } from "@/lib/db/drizzle";

import {
  products,
  type NewProduct,
  ActivityType,
  containers,
} from "@/lib/db/schema";
import { validatedActionWithUser } from "@/lib/auth/middleware";
import { logActivity } from "@/app/(login)/actions";
import { and, eq, isNull, sql } from "drizzle-orm";

const productSchema = z.object({
  name: z.string().min(2).max(255),
  container: z.string().min(1).transform(Number),
});

export const addProduct = validatedActionWithUser(
  productSchema,
  async (data, _, user) => {
    const { name, container } = data;

    const newProduct: NewProduct = {
      name,
      container,
    };
    let createdProduct;
    try {
      const [productCreated] = await db
        .insert(products)
        .values(newProduct)
        .returning();

      if (!productCreated) {
        throw new Error("Failed to create product");
      }
      createdProduct = productCreated;
    } catch (error: any) {
      if (error?.code === "23505") {
        // Unique constraint violation
        return {
          error: `Ya existe un producto con el nombre "${name}".`,
          name,
        };
      }
      console.log("🚀 ~ error creating product:", error);
      return {
        error:
          "Error al crear el producto. Por favor, inténtelo de nuevo." + error,
        name,
      };
    }

    console.log("Product Created");
    // TODO teamId should not be hardcoded
    const teamId = 1;
    await logActivity(teamId, user.id, ActivityType.CREATE_PRODUCT);
    return { name, success: "Producto creado correctamente" };
  }
);

const containerSchema = z.object({
  name: z.string().min(2).max(50),
  capacity: z.string().min(1),
  unit: z.string().min(1).max(20),
});

export const addContainer = validatedActionWithUser(
  containerSchema,
  async (data, _, user) => {
    const { name, capacity, unit } = data;
    const newContainer = {
      name,
      capacity,
      unit,
    };
    let createdContainer;
    try {
      const [containerCreated] = await db
        .insert(containers)
        .values(newContainer)
        .returning();

      if (!containerCreated) {
        throw new Error("Failed to create container");
      }
      createdContainer = containerCreated;
    } catch (error: any) {
      console.log("🚀 ~ error creating container:", error);
      return {
        error:
          "Error al crear el contenedor. Por favor, inténtelo de nuevo." +
          error,
        name,
      };
    }

    console.log("Container Created");
    // TODO teamId should not be hardcoded
    const teamId = 1;
    await logActivity(teamId, user.id, ActivityType.CREATE_CONTAINER);
    return { name, success: "Contenedor creado correctamente" };
  }
);

const updateProductSchema = z.object({
  id: z.string().min(1).transform(Number),
  name: z.string().min(2).max(255),
  container: z.string().min(1).transform(Number),
});

export const updateProduct = validatedActionWithUser(
  updateProductSchema,
  async (data, _, user) => {
    console.log("DATA RECIBIDA EN UPDATE:", data);
    const { name, container, id } = data;
    const productId = Number(id);
    console.log("ID COMO NUMERO:", productId);

    try {
      const [product] = await db
        .update(products)
        .set({ name, container, updatedAt: sql`now()` })
        .where(eq(products.id, productId))
        .returning();
      console.log("RESULTADO UPDATE:", product);
      if (!product) {
        throw new Error("Failed to update product");
      }
      return { ...product, success: "Producto actualizado correctamente" };
    } catch (error: any) {
      console.log("🚀 ~ error updating product:", error);
      return {
        error:
          "Error al actualizar el producto. Por favor, inténtelo de nuevo." +
          error,
        name,
      };
    }
  }
);

const updateContainerSchema = z.object({
  id: z.string().min(1).transform(Number),
  name: z.string().min(2).max(50),
  capacity: z.string().min(1),
  unit: z.string().min(1).max(20),
});

export const updateContainer = validatedActionWithUser(
  updateContainerSchema,
  async (data, _, user) => {
    console.log("DATA RECIBIDA EN UPDATE:", data);
    const { name, id, capacity, unit } = data;
    const containerId = Number(id);
    console.log("ID COMO NUMERO:", containerId);

    try {
      const [container] = await db
        .update(containers)
        .set({ name, capacity, unit, updatedAt: sql`now()` })
        .where(eq(containers.id, containerId))
        .returning();
      console.log("RESULTADO UPDATE:", container);
      if (!container) {
        throw new Error("Failed to update container");
      }
      return { ...container, success: "Contenedor actualizado correctamente" };
    } catch (error: any) {
      console.log("🚀 ~ error updating container:", error);
      return {
        error:
          "Error al actualizar el contenedor. Por favor, inténtelo de nuevo." +
          error,
        name,
      };
    }
  }
);

const deleteProductSchema = z.object({
  id: z.string().min(1).transform(Number),
});

export const deleteProduct = validatedActionWithUser(
  deleteProductSchema,
  async (data, _, user) => {
    const { id } = data;
    try {
      // debugger
      const [product] = await db
        .update(products)
        .set({ deletedAt: sql`now()` })
        .where(eq(products.id, id))
        .returning();
      if (!product) {
        throw new Error("Failed to delete product");
      }
      return { id, success: "Producto eliminado correctamente" };
    } catch (error: any) {
      console.log("🚀 ~ error deleting product:", error);
      return {
        error:
          "Error al eliminar el producto. Por favor, inténtelo de nuevo." +
          error,
      };
    }
  }
);

const deleteContainerSchema = z.object({
  id: z.string().min(1).transform(Number),
});

export const deleteContainer = validatedActionWithUser(
  deleteContainerSchema,
  async (data, _, user) => {
    const { id } = data;
    try {
      // Look if there are products associated with this container
      const associatedProducts = await db
        .select()
        .from(products)
        .where(and(
          eq(products.container, id), 
          isNull(products.deletedAt))
        );

      if (associatedProducts.length > 0) {
        throw new Error(
          "No se puede eliminar el contenedor porque tiene productos asociados."
        );
      }

      const [container] = await db
        .update(containers)
        .set({ deletedAt: sql`now()` })
        .where(eq(containers.id, id))
        .returning();
      if (!container) {
        throw new Error("Failed to delete container");
      }
      return { id, success: "Contenedor eliminado correctamente" };
    } catch (error: any) {
      console.log("🚀 ~ error deleting container:", error);
      return {
        error:
          "Error al eliminar el contenedor. Por favor, inténtelo de nuevo." +
          error,
      };
    }
  }
);
