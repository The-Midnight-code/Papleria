"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { activityLogs, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/authorization";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

type ChangePasswordResult =
  | { success: true }
  | { success: false; error: string };

export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<ChangePasswordResult> {
  const user = await requireUser();

  if (!currentPassword) {
    return {
      success: false,
      error: "La contraseña actual es obligatoria.",
    };
  }

  if (newPassword.length < 8) {
    return {
      success: false,
      error: "La nueva contraseña debe tener al menos 8 caracteres.",
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      success: false,
      error: "Las contraseñas no coinciden.",
    };
  }

  if (currentPassword === newPassword) {
    return {
      success: false,
      error: "La nueva contraseña debe ser diferente a la actual.",
    };
  }

  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
  });

  if (!currentUser) {
    return {
      success: false,
      error: "El usuario no existe.",
    };
  }

  const isCurrentPasswordValid = await verifyPassword(
    currentPassword,
    currentUser.passwordHash,
  );

  if (!isCurrentPasswordValid) {
    return {
      success: false,
      error: "La contraseña actual es incorrecta.",
    };
  }

  const passwordHash = await hashPassword(newPassword);

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await tx.insert(activityLogs).values({
      userId: user.id,
      module: "USERS",
      action: "CHANGE_PASSWORD",
      entityType: "USER",
      entityId: user.id,
      metadata: {
        username: user.username,
        name: user.name,
      },
    });
  });

  return {
    success: true,
  };
}

export async function updateProfile(
  name: string,
  username: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const user = await requireUser();

  const normalizedName = name.trim();
  const normalizedUsername = username.trim().toLowerCase();

  if (!normalizedName) {
    return {
      success: false,
      error: "El nombre es obligatorio.",
    };
  }

  if (normalizedName.length > 100) {
    return {
      success: false,
      error: "El nombre no puede tener más de 100 caracteres.",
    };
  }

  if (!normalizedUsername) {
    return {
      success: false,
      error: "El usuario es obligatorio.",
    };
  }

  if (normalizedUsername.length > 50) {
    return {
      success: false,
      error: "El usuario no puede tener más de 50 caracteres.",
    };
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.username, normalizedUsername),
  });

  if (existingUser && existingUser.id !== user.id) {
    return {
      success: false,
      error: "Ese nombre de usuario ya está en uso.",
    };
  }

  const nameChanged = normalizedName !== user.name;
  const usernameChanged = normalizedUsername !== user.username;

  if (!nameChanged && !usernameChanged) {
    return {
      success: false,
      error: "No hay cambios para guardar.",
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        name: normalizedName,
        username: normalizedUsername,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await tx.insert(activityLogs).values({
      userId: user.id,
      module: "USERS",
      action: "UPDATE_PROFILE",
      entityType: "USER",
      entityId: user.id,
      metadata: {
        previousName: user.name,
        newName: normalizedName,
        previousUsername: user.username,
        newUsername: normalizedUsername,
      },
    });
  });

  return {
    success: true,
  };
}
