"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { services, activityLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";

type ServiceInput = {
  name: string;
  description: string | null;
  category: string;
  price: string | null;
  requiresQuote: boolean;
  estimatedDays: number | null;
  published: boolean;
};

function parseService(
  formData: FormData,
): { data: ServiceInput } | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const priceInput = String(formData.get("price") ?? "").trim();
  const requiresQuote = formData.get("requiresQuote") === "on";
  const published = formData.get("published") === "on";
  const daysInput = String(formData.get("estimatedDays") ?? "").trim();

  if (!name || name.length > 150) {
    return {
      error: "El nombre es obligatorio y no debe superar 150 caracteres.",
    };
  }

  if (!category || category.length > 100) {
    return {
      error: "La categoría es obligatoria y no debe superar 100 caracteres.",
    };
  }

  if (description && description.length > 5000) {
    return { error: "La descripción no puede superar 5000 caracteres." };
  }

  let price: string | null = null;

  if (priceInput) {
    const amount = Number(priceInput);

    if (!Number.isFinite(amount) || amount < 0 || amount > 99999999.99) {
      return { error: "Ingresa un precio válido." };
    }

    if (!/^\d+(\.\d{1,2})?$/.test(priceInput)) {
      return { error: "El precio admite máximo dos decimales." };
    }

    price = amount.toFixed(2);
  }

  if (!requiresQuote && price === null) {
    return { error: "Ingresa un precio o activa la opción de cotización." };
  }

  let estimatedDays: number | null = null;

  if (daysInput) {
    const days = Number(daysInput);

    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return { error: "Los días estimados deben ser un entero entre 1 y 365." };
    }

    estimatedDays = days;
  }

  return {
    data: {
      name,
      description,
      category,
      price,
      requiresQuote,
      estimatedDays,
      published,
    },
  };
}

export async function createService(formData: FormData) {
  const user = await requireAdmin();
  const parsed = parseService(formData);

  if ("error" in parsed) return parsed;

  const [service] = await db
    .insert(services)
    .values({
      ...parsed.data,
      createdBy: user.id,
    })
    .returning({
      id: services.id,
      name: services.name,
    });

  await db.insert(activityLogs).values({
    userId: user.id,
    module: "SERVICES",
    action: "CREATE_SERVICE",
    entityType: "SERVICE",
    entityId: service.id,
    previousValue: null,
    newValue: service.name,
    metadata: {
      category: parsed.data.category,
      published: parsed.data.published,
    },
  });

  revalidatePath("/services");
  revalidatePath("/servicios");

  return { success: true };
}

export async function updateService(serviceId: string, formData: FormData) {
  const user = await requireAdmin();
  const parsed = parseService(formData);

  if ("error" in parsed) return parsed;

  const [existing] = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  if (!existing) {
    return { error: "El servicio no existe." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(services)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(services.id, serviceId));

    await tx.insert(activityLogs).values({
      userId: user.id,
      module: "SERVICES",
      action: "UPDATE_SERVICE",
      entityType: "SERVICE",
      entityId: serviceId,
      previousValue: existing.name,
      newValue: parsed.data.name,
      metadata: {
        previousCategory: existing.category,
        category: parsed.data.category,
        previousPublished: existing.published,
        published: parsed.data.published,
      },
    });
  });

  revalidatePath("/services");
  revalidatePath("/servicios");

  return { success: true };
}

export async function setServiceActive(serviceId: string, active: boolean) {
  const user = await requireAdmin();

  const [existing] = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  if (!existing) {
    return { error: "El servicio no existe." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(services)
      .set({
        active,
        updatedAt: new Date(),
      })
      .where(eq(services.id, serviceId));

    await tx.insert(activityLogs).values({
      userId: user.id,
      module: "SERVICES",
      action: active ? "ACTIVATE_SERVICE" : "DEACTIVATE_SERVICE",
      entityType: "SERVICE",
      entityId: serviceId,
      previousValue: existing.active ? "Activo" : "Inactivo",
      newValue: active ? "Activo" : "Inactivo",
      metadata: { serviceName: existing.name },
    });
  });

  revalidatePath("/services");
  revalidatePath("/servicios");

  return { success: true };
}
