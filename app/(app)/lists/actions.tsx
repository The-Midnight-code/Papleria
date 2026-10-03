"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { lists, activityLogs } from "@/db/schema";
import { requireUser, requireAdmin } from "@/lib/auth/authorization";

export async function createList(formData: FormData) {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return {
      error: "El nombre de la lista es obligatorio.",
    };
  }

  if (name.length > 100) {
    return {
      error: "El nombre de la lista no puede superar los 100 caracteres.",
    };
  }

  await db.insert(lists).values({
    name,
    createdBy: user.id,
  });

  revalidatePath("/lists");

  return {
    success: true,
  };
}

export async function deleteList(listId: string) {
  const user = await requireAdmin();
  const list = await db.query.lists.findFirst({
    where: eq(lists.id, listId),
    with: { clients: { with: { client: true } } },
  });

  if (!list) {
    return { error: "La lista no existe." };
  }

  await db.transaction(async (tx) => {
    await tx.insert(activityLogs).values({
      userId: user.id,
      module: "LISTS",
      action: "DELETE_LIST",
      entityType: "LIST",
      entityId: list.id,
      previousValue: list.name,
      newValue: null,
      metadata: {
        listName: list.name,
        clientCount: list.clients.length,
        clientNames: list.clients.map((relation) => relation.client.name),
      },
    });

    await tx.delete(lists).where(eq(lists.id, listId));
  });

  revalidatePath("/lists");
  return { success: true };
}
