"use server";

import { z } from "zod";
import { db } from "@/lib/db/drizzle";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { products, type NewProduct, ActivityType } from "@/lib/db/schema";
import { validatedActionWithUser } from "@/lib/auth/middleware";
import { logActivity } from "@/app/(login)/actions";
import { eq, isNull, sql } from "drizzle-orm";

const productSchema = z.object({
  name: z.string().min(2).max(255),
});

export const addProduct = validatedActionWithUser(
  productSchema,
  async (data, _, user) => {
    
    const { name } = data;
    const newProduct: NewProduct = {
      name,
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

const updateProductSchema = z.object({
  id: z.string().min(1).transform(Number),
  name: z.string().min(2).max(255),
});

export const updateProduct = validatedActionWithUser(
  updateProductSchema,
  async (data, _, user) => {
    console.log("DATA RECIBIDA EN UPDATE:", data);
    const { name, id } = data;
    const productId = Number(id);
    console.log("ID COMO NUMERO:", productId);

    try {
      const [product] = await db
        .update(products)
        .set({ name, updatedAt: sql`now()` })
        .where(eq(products.id, productId))
        .returning();
      console.log("RESULTADO UPDATE:", product);
      if (!product) {
        throw new Error("Failed to update product");
      }
      return { id, name, success: "Producto actualizado correctamente" };
    } catch (error: any) {
      console.log("🚀 ~ error updating product:", error);
      return {
        error: "Error al actualizar el producto. Por favor, inténtelo de nuevo." + error,
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
        debugger
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
        error: "Error al eliminar el producto. Por favor, inténtelo de nuevo." + error,
      };
    }
  }
);

