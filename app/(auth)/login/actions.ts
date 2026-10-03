"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

export type LoginState = {
  error?: string;
};

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = formData.get("username");
  const password = formData.get("password");

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !password
  ) {
    return {
      error: "Usuario y contraseña son obligatorios.",
    };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.username, username.trim()),
  });

  if (!user || !user.active) {
    return {
      error: "Usuario o contraseña incorrectos.",
    };
  }

  const passwordIsValid = await verifyPassword(password, user.passwordHash);

  if (!passwordIsValid) {
    return {
      error: "Usuario o contraseña incorrectos.",
    };
  }

  await createSession(user.id);

  redirect("/dashboard");
}
