"use server";

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

export async function createProduct(formData: FormData) {
  try {
    const user = await requireEmployeeOrAdmin();
    const name = String(formData.get("name") ?? "").trim();
    const sku = String(formData.get("sku") ?? "").trim().toUpperCase();
    const category = String(formData.get("category") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const costPrice = parsePrice(formData.get("costPrice"), "El precio de compra");
    const salePrice = parsePrice(formData.get("salePrice"), "El precio de venta");
    const stockQuantity = parseCount(formData.get("stockQuantity"), "Las existencias");
    const minStock = parseCount(formData.get("minStock"), "El stock mínimo");

    if (!name || name.length > 160) return { error: "El nombre es obligatorio y admite hasta 160 caracteres." };
    if (!sku || sku.length > 60 || !/^[A-Z0-9._/-]+$/.test(sku)) return { error: "Ingresa un SKU válido (letras, números, punto, guion o diagonal)." };
    if (!category || category.length > 100) return { error: "La categoría es obligatoria y admite hasta 100 caracteres." };
    if (description && description.length > 2000) return { error: "La descripción admite hasta 2000 caracteres." };

    const result = await db.transaction(async (tx) => {
      const [product] = await tx.insert(products).values({
        name, sku, category, description, costPrice, salePrice, stockQuantity, minStock, createdBy: user.id,
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
    if (error instanceof Error && error.message.toLowerCase().includes("products_sku_unique")) {
      return { error: "Ya existe un producto con ese SKU." };
    }
    return { error: error instanceof Error ? error.message : "No fue posible registrar el producto." };
  }
}
