import "dotenv/config";

import argon2 from "argon2";

import { db } from "../db/db";
import { users } from "../db/schema";

async function main() {
  const username = "admin";
  const password = "admin123";
  const name = "Administrador";

  const existingUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.username, username),
  });

  if (existingUser) {
    console.log(`User "${username}" already exists.`);
    return;
  }

  const passwordHash = await argon2.hash(password);

  await db.insert(users).values({
    name,
    username,
    passwordHash,
    role: "ADMIN",
  });

  console.log("Initial admin created successfully.");
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
