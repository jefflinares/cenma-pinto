"use server";

import { z } from "zod";
import { db } from "@/lib/db/drizzle";

import {
  products,
  type NewProduct,
  ActivityType,
  containers,
  incomeDetails,
  productClassification,
  type NewProductClassification,
} from "@/lib/db/schema";
import { validatedActionWithUser } from "@/lib/auth/middleware";
import { logActivity } from "@/app/(login)/actions";
import { and, eq, isNull, sql } from "drizzle-orm";

const productSchema = z.object({
  name: z.string().min(2).max(255),
  container: z.string().min(1).transform(Number),
  productClassification: z.string().optional().transform((value) =>
    value ? Number(value) : undefined
  ),
});

export const addProduct = validatedActionWithUser(
  productSchema,
  async (data, _, user) => {
    const { name, container, productClassification } = data;

    const newProduct: NewProduct = {
      name,
      container,
      productClassification,
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
  },
  'addProduct'
);

const containerSchema = z.object({
  name: z.string().min(2).max(50),
  unitPrice: z.string().min(1),
});

export const addContainer = validatedActionWithUser(
  containerSchema,
  async (data, _, user) => {
    const { name, unitPrice } = data;
    const newContainer = {
      name,
      unitPrice,
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
          "Error al crear el envase. Por favor, inténtelo de nuevo." +
          error,
        name,
      };
    }

    console.log("Container Created");
    // TODO teamId should not be hardcoded
    const teamId = 1;
    await logActivity(teamId, user.id, ActivityType.CREATE_CONTAINER);
    return { name, success: "Envase creado correctamente" };
  },
  'addContainer'
);

const updateProductSchema = z.object({
  id: z.string().min(1).transform(Number),
  name: z.string().min(2).max(255),
  container: z.string().min(1).transform(Number),
  productClassification: z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      return value === "" ? null : Number(value);
    }),
});

export const updateProduct = validatedActionWithUser(
  updateProductSchema,
  async (data, _, user) => {
    console.log("DATA RECIBIDA EN UPDATE:", data);
    const { name, container, productClassification, id } = data;
    const productId = Number(id);
    console.log("ID COMO NUMERO:", productId);

    try {
      const updateData: Record<string, any> = {
        name,
        container,
        updatedAt: sql`now()`,
      };

      if (productClassification !== undefined) {
        updateData.productClassification = productClassification;
      }

      const [product] = await db
        .update(products)
        .set(updateData)
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
  },
  'updateProduct'
);

const updateContainerSchema = z.object({
  id: z.string().min(1).transform(Number),
  name: z.string().min(2).max(50),
  unitPrice: z.string().min(1),
});

export const updateContainer = validatedActionWithUser(
  updateContainerSchema,
  async (data, _, user) => {
    console.log("DATA RECIBIDA EN UPDATE:", data);
    const { name, id, unitPrice } = data;
    const containerId = Number(id);
    console.log("ID COMO NUMERO:", containerId);

    try {
      const [container] = await db
        .update(containers)
        .set({ name, unitPrice, updatedAt: sql`now()` })
        .where(eq(containers.id, containerId))
        .returning();
      console.log("RESULTADO UPDATE:", container);
      if (!container) {
        throw new Error("Failed to update container");
      }
      return { ...container, success: "Envase actualizado correctamente" };
    } catch (error: any) {
      console.log("🚀 ~ error updating container:", error);
      return {
        error:
          "Error al actualizar el envase. Por favor, inténtelo de nuevo." +
          error,
        name,
      };
    }
  },
  'updateContainer'
);

const deleteProductSchema = z.object({
  id: z.string().min(1).transform(Number),
});

export const deleteProduct = validatedActionWithUser(
  deleteProductSchema,
  async (data, _, user) => {
    const { id } = data;
    try {
      // Identify if thee product is associated with any income records
      const associatedIncomes = await db
        .select()
        .from(incomeDetails)
        .where(
          and(eq(incomeDetails.productId, id), isNull(incomeDetails.deletedAt))
        );
      if (associatedIncomes.length > 0) {
        throw new Error(
          "No se puede eliminar el producto porque está asociado a registros de ingresos."
        );
      }

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
  },
  'deleteProduct'
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
        .where(and(eq(products.container, id), isNull(products.deletedAt)));

      if (associatedProducts.length > 0) {
        throw new Error(
          "No se puede eliminar el envase porque tiene productos asociados."
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
      return { id, success: "Envase eliminado correctamente" };
    } catch (error: any) {
      console.log("🚀 ~ error deleting container:", error);
      return {
        error:
          "Error al eliminar el envase. Por favor, inténtelo de nuevo." +
          error,
      };
    }
  },
  'deleteContainer'
);

// ProductClassification Actions
const productClassificationSchema = z.object({
  name: z.string().min(2).max(100),
  svgIcon: z.string().optional().nullable(),
});

export const addProductClassification = validatedActionWithUser(
  productClassificationSchema,
  async (data, _, user) => {
    const { name, svgIcon } = data;

    const newProductClassification: NewProductClassification = {
      name,
      svgIcon: svgIcon || null,
    };
    let createdClassification;
    try {
      const [classificationCreated] = await db
        .insert(productClassification)
        .values(newProductClassification)
        .returning();

      if (!classificationCreated) {
        throw new Error("Failed to create product classification");
      }
      createdClassification = classificationCreated;
    } catch (error: any) {
      if (error?.code === "23505") {
        // Unique constraint violation
        return {
          error: `Ya existe una clasificación con el nombre "${name}".`,
          name,
        };
      }
      console.log("🚀 ~ error creating product classification:", error);
      return {
        error:
          "Error al crear la clasificación. Por favor, inténtelo de nuevo." + error,
        name,
      };
    }

    console.log("Product Classification Created");
    // TODO teamId should not be hardcoded
    const teamId = 1;
    await logActivity(teamId, user.id, ActivityType.CREATE_PRODUCT);
    return { name, success: "Clasificación creada correctamente" };
  },
  'addProductClassification'
);

const updateProductClassificationSchema = z.object({
  id: z.string().min(1).transform(Number),
  name: z.string().min(2).max(100),
  svgIcon: z.string().optional().nullable(),
});

export const updateProductClassification = validatedActionWithUser(
  updateProductClassificationSchema,
  async (data, _, user) => {
    console.log("DATA RECIBIDA EN UPDATE:", data);
    const { name, id, svgIcon } = data;
    const classificationId = Number(id);
    console.log("ID COMO NUMERO:", classificationId);

    try {
      const [classification] = await db
        .update(productClassification)
        .set({ name, svgIcon: svgIcon || null, updatedAt: sql`now()` })
        .where(eq(productClassification.id, classificationId))
        .returning();
      console.log("RESULTADO UPDATE:", classification);
      if (!classification) {
        throw new Error("Failed to update product classification");
      }
      return { ...classification, success: "Clasificación actualizada correctamente" };
    } catch (error: any) {
      console.log("🚀 ~ error updating product classification:", error);
      return {
        error:
          "Error al actualizar la clasificación. Por favor, inténtelo de nuevo." +
          error,
        name,
      };
    }
  },
  'updateProductClassification'
);

const deleteProductClassificationSchema = z.object({
  id: z.string().min(1).transform(Number),
});

export const deleteProductClassification = validatedActionWithUser(
  deleteProductClassificationSchema,
  async (data, _, user) => {
    const { id } = data;
    try {
      const [classification] = await db
        .update(productClassification)
        .set({ deletedAt: sql`now()` })
        .where(eq(productClassification.id, id))
        .returning();
      if (!classification) {
        throw new Error("Failed to delete product classification");
      }
      return { id, success: "Clasificación eliminada correctamente" };
    } catch (error: any) {
      console.log("🚀 ~ error deleting product classification:", error);
      return {
        error:
          "Error al eliminar la clasificación. Por favor, inténtelo de nuevo." +
          error,
      };
    }
  },
  'deleteProductClassification'
);
