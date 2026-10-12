"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/db";
import { activityLogs, products } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";

function parsePrice(value: FormDataEntryValue | null, label: string) {
  const normalized = String(value ?? "").trim();
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`${label} debe ser un importe válido.`);
  }
  return Number(normalized).toFixed(2);
}

function parseCount(value: FormDataEntryValue | null, label: string) {
  const normalized = String(value ?? "0").trim();
  if (!/^\d{1,7}$/.test(normalized)) {
    throw new Error(`${label} debe ser un número entero igual o mayor que cero.`);
  }
  return Number(normalized);
}

function getProductFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim().toUpperCase();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const costPrice = parsePrice(formData.get("costPrice"), "El precio de compra");
  const salePrice = parsePrice(formData.get("salePrice"), "El precio de venta");
  const minStock = parseCount(formData.get("minStock"), "El stock mínimo");

  if (!name || name.length > 160) return { error: "El nombre es obligatorio y admite hasta 160 caracteres." };
  if (!sku || sku.length > 60 || !/^[A-Z0-9._/-]+$/.test(sku)) return { error: "Ingresa un SKU válido (letras, números, punto, guion o diagonal)." };
  if (!category || category.length > 100) return { error: "La categoría es obligatoria y admite hasta 100 caracteres." };
  if (description && description.length > 2000) return { error: "La descripción admite hasta 2000 caracteres." };

  return { values: { name, sku, category, description, costPrice, salePrice, minStock } };
}

function getActionError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.toLowerCase().includes("products_sku_unique")) {
    return "Ya existe un producto con ese SKU.";
  }
  return error instanceof Error ? error.message : fallback;
}

export async function createProduct(formData: FormData) {
  try {
    const user = await requireEmployeeOrAdmin();
    const parsed = getProductFields(formData);
    if ("error" in parsed) return { error: parsed.error };
    const stockQuantity = parseCount(formData.get("stockQuantity"), "Las existencias");
    const productValues = user.role === "ADMIN" ? parsed.values : { ...parsed.values, costPrice: "0.00", salePrice: "0.00" };

    const result = await db.transaction(async (tx) => {
      const [product] = await tx.insert(products).values({
        ...productValues,
        stockQuantity,
        createdBy: user.id,
      }).returning({ id: products.id, name: products.name, sku: products.sku });

      await tx.insert(activityLogs).values({
        userId: user.id,
        module: "inventory",
        action: "CREATE_PRODUCT",
        entityType: "product",
        entityId: product.id,
        newValue: product.sku,
        metadata: { name: product.name, sku: product.sku, stockQuantity },
      });
      return product;
    });

    revalidatePath("/inventory");
    return { success: true, product: result };
  } catch (error) {
    return { error: getActionError(error, "No fue posible registrar el producto.") };
  }
}

export async function updateProduct(productId: string, formData: FormData) {
  try {
    const user = await requireEmployeeOrAdmin();
    if (typeof productId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId)) {
      return { error: "El producto seleccionado no es válido." };
    }

    const parsed = getProductFields(formData);
    if ("error" in parsed) return { error: parsed.error };

    const result = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
      if (!current) throw new Error("El producto ya no existe.");

      const editableValues = user.role === "ADMIN" ? parsed.values : { ...parsed.values, costPrice: current.costPrice, salePrice: current.salePrice };
      const [updated] = await tx.update(products).set({
        ...editableValues,
        updatedAt: new Date(),
      }).where(eq(products.id, productId)).returning({
        id: products.id,
        name: products.name,
        sku: products.sku,
      });

      await tx.insert(activityLogs).values({
        userId: user.id,
        module: "inventory",
        action: "UPDATE_PRODUCT",
        entityType: "product",
        entityId: productId,
        previousValue: current.sku,
        newValue: updated.sku,
        metadata: {
          previous: { name: current.name, sku: current.sku, category: current.category, costPrice: current.costPrice, salePrice: current.salePrice, minStock: current.minStock },
          updated: { name: updated.name, sku: updated.sku, category: parsed.values.category, costPrice: updated.costPrice, salePrice: updated.salePrice, minStock: parsed.values.minStock },
        },
      });
      return updated;
    });

    revalidatePath("/inventory");
    return { success: true, product: result };
  } catch (error) {
    return { error: getActionError(error, "No fue posible actualizar el producto.") };
  }
}

export async function setProductActive(productId: string, active: boolean) {
  try {
    const user = await requireEmployeeOrAdmin();
    if (typeof productId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId)) {
      return { error: "El producto seleccionado no es válido." };
    }
    if (typeof active !== "boolean") return { error: "El estado seleccionado no es válido." };

    const result = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(products).where(eq(products.id, productId)).limit(1);
      if (!current) throw new Error("El producto ya no existe.");
      if (current.active === active) return { id: current.id, active: current.active, sku: current.sku };

      const [updated] = await tx.update(products).set({ active, updatedAt: new Date() })
        .where(eq(products.id, productId)).returning({ id: products.id, active: products.active, sku: products.sku });

      await tx.insert(activityLogs).values({
        userId: user.id,
        module: "inventory",
        action: active ? "ACTIVATE_PRODUCT" : "DEACTIVATE_PRODUCT",
        entityType: "product",
        entityId: productId,
        previousValue: current.active ? "active" : "inactive",
        newValue: active ? "active" : "inactive",
        metadata: { name: current.name, sku: current.sku },
      });
      return updated;
    });

    revalidatePath("/inventory");
    return { success: true, product: result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No fue posible cambiar el estado del producto." };
  }
}
