"use server";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db/db";
import { activityLogs, reminders, userReminders, users } from "@/db/schema";
import { requireAdmin, requireUser } from "@/lib/auth/authorization";

type ReminderResult = { success: true } | { success: false; error: string };

export async function createReminder(
  title: string,
  message: string,
  scheduledAt: string,
): Promise<ReminderResult> {
  const admin = await requireAdmin();

  const normalizedTitle = title.trim();
  const normalizedMessage = message.trim();

  if (!normalizedTitle) {
    return {
      success: false,
      error: "El título es obligatorio.",
    };
  }

  if (normalizedTitle.length > 150) {
    return {
      success: false,
      error: "El título no puede tener más de 150 caracteres.",
    };
  }

  if (normalizedMessage.length > 500) {
    return {
      success: false,
      error: "El mensaje no puede tener más de 500 caracteres.",
    };
  }

  const parsedScheduledAt = scheduledAt ? new Date(scheduledAt) : null;

  if (parsedScheduledAt && Number.isNaN(parsedScheduledAt.getTime())) {
    return {
      success: false,
      error: "La fecha y hora del recordatorio no son válidas.",
    };
  }

  const activeUsers = await db.query.users.findMany({
    where: eq(users.active, true),
    columns: {
      id: true,
    },
  });

  if (activeUsers.length === 0) {
    return {
      success: false,
      error: "No existen usuarios activos para asignar el recordatorio.",
    };
  }

  await db.transaction(async (tx) => {
    const [newReminder] = await tx
      .insert(reminders)
      .values({
        title: normalizedTitle,
        message: normalizedMessage || null,
        scheduledAt: parsedScheduledAt,
        createdBy: admin.id,
      })
      .returning({
        id: reminders.id,
      });

    await tx.insert(userReminders).values(
      activeUsers.map((user) => ({
        reminderId: newReminder.id,
        userId: user.id,
      })),
    );

    await tx.insert(activityLogs).values({
      userId: admin.id,
      module: "REMINDERS",
      action: "CREATE",
      entityType: "REMINDER",
      entityId: newReminder.id,
      metadata: {
        title: normalizedTitle,
        scheduledAt: parsedScheduledAt?.toISOString() ?? null,
      },
    });
  });

  return {
    success: true,
  };
}

export async function updateReminder(
  reminderId: string,
  title: string,
  message: string,
  scheduledAt: string,
): Promise<ReminderResult> {
  const admin = await requireAdmin();

  const normalizedTitle = title.trim();
  const normalizedMessage = message.trim();

  if (!normalizedTitle) {
    return {
      success: false,
      error: "El título es obligatorio.",
    };
  }

  if (normalizedTitle.length > 150) {
    return {
      success: false,
      error: "El título no puede tener más de 150 caracteres.",
    };
  }

  if (normalizedMessage.length > 500) {
    return {
      success: false,
      error: "El mensaje no puede tener más de 500 caracteres.",
    };
  }

  const parsedScheduledAt = scheduledAt ? new Date(scheduledAt) : null;

  if (parsedScheduledAt && Number.isNaN(parsedScheduledAt.getTime())) {
    return {
      success: false,
      error: "La fecha y hora del recordatorio no son válidas.",
    };
  }

  const reminder = await db.query.reminders.findFirst({
    where: eq(reminders.id, reminderId),
  });

  if (!reminder) {
    return {
      success: false,
      error: "El recordatorio no existe.",
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(reminders)
      .set({
        title: normalizedTitle,
        message: normalizedMessage || null,
        scheduledAt: parsedScheduledAt,
        updatedAt: new Date(),
      })
      .where(eq(reminders.id, reminderId));

    await tx.insert(activityLogs).values({
      userId: admin.id,
      module: "REMINDERS",
      action: "UPDATE",
      entityType: "REMINDER",
      entityId: reminderId,
      metadata: {
        previousTitle: reminder.title,
        newTitle: normalizedTitle,
        previousMessage: reminder.message,
        newMessage: normalizedMessage || null,
        previousScheduledAt: reminder.scheduledAt?.toISOString() ?? null,
        newScheduledAt: parsedScheduledAt?.toISOString() ?? null,
      },
    });
  });

  return {
    success: true,
  };
}

export async function deleteReminder(
  reminderId: string,
): Promise<ReminderResult> {
  const admin = await requireAdmin();

  const reminder = await db.query.reminders.findFirst({
    where: eq(reminders.id, reminderId),
  });

  if (!reminder) {
    return {
      success: false,
      error: "El recordatorio no existe.",
    };
  }

  await db.transaction(async (tx) => {
    await tx.delete(reminders).where(eq(reminders.id, reminderId));

    await tx.insert(activityLogs).values({
      userId: admin.id,
      module: "REMINDERS",
      action: "DELETE",
      entityType: "REMINDER",
      entityId: reminderId,
      metadata: {
        title: reminder.title,
      },
    });
  });

  return {
    success: true,
  };
}

export async function getMyReminders() {
  const user = await requireUser();

  return db.query.userReminders.findMany({
    where: eq(userReminders.userId, user.id),
    with: {
      reminder: {
        with: {
          creator: true,
        },
      },
    },
    orderBy: (userReminders, { asc }) => [asc(userReminders.completedAt)],
  });
}

export async function completeReminder(
  userReminderId: string,
): Promise<ReminderResult> {
  const user = await requireUser();

  const userReminder = await db.query.userReminders.findFirst({
    where: eq(userReminders.id, userReminderId),
    with: {
      reminder: true,
    },
  });

  if (!userReminder) {
    return {
      success: false,
      error: "El recordatorio no existe.",
    };
  }

  if (userReminder.userId !== user.id) {
    return {
      success: false,
      error: "No tienes permiso para modificar este recordatorio.",
    };
  }

  if (userReminder.completedAt) {
    return {
      success: false,
      error: "Este recordatorio ya fue marcado como realizado.",
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(userReminders)
      .set({
        completedAt: new Date(),
      })
      .where(eq(userReminders.id, userReminderId));

    await tx.insert(activityLogs).values({
      userId: user.id,
      module: "REMINDERS",
      action: "COMPLETE",
      entityType: "REMINDER",
      entityId: userReminder.reminderId,
      metadata: {
        title: userReminder.reminder.title,
      },
    });
  });

  return {
    success: true,
  };
}

export async function getPendingReminderCount(): Promise<number> {
  const user = await requireUser();

  const now = new Date();

  const pendingReminders = await db.query.userReminders.findMany({
    where: and(
      eq(userReminders.userId, user.id),
      isNull(userReminders.completedAt),
    ),
    with: {
      reminder: {
        columns: {
          scheduledAt: true,
        },
      },
    },
  });

  return pendingReminders.filter(
    (item) => !item.reminder.scheduledAt || item.reminder.scheduledAt <= now,
  ).length;
}
