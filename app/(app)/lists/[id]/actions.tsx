"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db/db";
import { clients, listClients, activityLogs } from "@/db/schema";
import { requireUser } from "@/lib/auth/authorization";

export async function addClientToList(listId: string, formData: FormData) {
  await requireUser();

  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return {
      error: "El nombre del cliente es obligatorio.",
    };
  }

  if (name.length > 100) {
    return {
      error: "El nombre del cliente no puede superar los 100 caracteres.",
    };
  }

  const list = await db.query.lists.findFirst({
    where: (lists, { eq }) => eq(lists.id, listId),
  });

  if (!list) {
    return {
      error: "La lista no existe.",
    };
  }

  let client = await db.query.clients.findFirst({
    where: sql`lower(${clients.name}) = lower(${name})`,
  });

  if (!client) {
    const [newClient] = await db
      .insert(clients)
      .values({
        name,
      })
      .returning();

    client = newClient;
  }

  const existingRelation = await db.query.listClients.findFirst({
    where: (relations, { and, eq }) =>
      and(eq(relations.listId, listId), eq(relations.clientId, client.id)),
  });

  if (existingRelation) {
    return {
      error: "Este cliente ya pertenece a la lista.",
    };
  }

  await db.insert(listClients).values({
    listId,
    clientId: client.id,
    paymentStatus: "UNPAID",
  });

  revalidatePath(`/lists/${listId}`);
  revalidatePath("/lists");

  return {
    success: true,
  };
}

export async function togglePaymentStatus(listClientId: string) {
  const user = await requireUser();

  const relation = await db.query.listClients.findFirst({
    where: eq(listClients.id, listClientId),
    with: {
      list: true,
      client: true,
    },
  });

  if (!relation) {
    return {
      error: "El cliente no pertenece a ninguna lista.",
    };
  }

  const previousStatus = relation.paymentStatus;
  const newStatus = previousStatus === "UNPAID" ? "PAID" : "UNPAID";

  await db.transaction(async (tx) => {
    await tx
      .update(listClients)
      .set({
        paymentStatus: newStatus,
        paidAt: newStatus === "PAID" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(listClients.id, listClientId));

    await tx.insert(activityLogs).values({
      userId: user.id,
      module: "LISTS",
      action: "UPDATE_PAYMENT_STATUS",
      entityType: "LIST_CLIENT",
      entityId: listClientId,
      previousValue: previousStatus,
      newValue: newStatus,
      metadata: {
        listId: relation.listId,
        listName: relation.list.name,
        clientId: relation.clientId,
        clientName: relation.client.name,
      },
    });
  });

  revalidatePath(`/lists/${relation.listId}`);

  return {
    success: true,
  };
}
