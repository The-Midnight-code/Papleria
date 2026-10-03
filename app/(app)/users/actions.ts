"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { activityLogs, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";
import { hashPassword } from "@/lib/auth/password";

type CreateUserResult = { success: true } | { success: false; error: string };

export async function createUser(
  name: string,
  username: string,
  password: string,
  confirmPassword: string,
): Promise<CreateUserResult> {
  const admin = await requireAdmin();

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

  if (password.length < 8) {
    return {
      success: false,
      error: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: "Las contraseñas no coinciden.",
    };
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.username, normalizedUsername),
  });

  if (existingUser) {
    return {
      success: false,
      error: "Ese nombre de usuario ya está en uso.",
    };
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await db
    .insert(users)
    .values({
      name: normalizedName,
      username: normalizedUsername,
      passwordHash,
      role: "EMPLOYEE",
      active: true,
    })
    .returning({
      id: users.id,
      name: users.name,
      username: users.username,
    });

  await db.insert(activityLogs).values({
    module: "USERS",
    action: "CREATE",
    entityType: "USER",
    entityId: newUser.id,
    metadata: {
      username: newUser.username,
      name: newUser.name,
      performedBy: admin.id,
    },
  });

  return {
    success: true,
  };
}

export async function toggleUserStatus(
  userId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const admin = await requireAdmin();

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return {
      success: false,
      error: "El usuario no existe.",
    };
  }

  if (user.id === admin.id) {
    return {
      success: false,
      error: "No puedes cambiar el estado de tu propia cuenta.",
    };
  }

  const newActiveStatus = !user.active;

  await db
    .update(users)
    .set({
      active: newActiveStatus,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await db.insert(activityLogs).values({
    module: "USERS",
    action: newActiveStatus ? "ACTIVATE" : "DEACTIVATE",
    entityType: "USER",
    entityId: user.id,
    metadata: {
      username: user.username,
      name: user.name,
      performedBy: admin.id,
    },
  });

  return {
    success: true,
  };
}
