import "dotenv/config";

import argon2 from "argon2";

import { db } from "../db/db";
import { users } from "../db/schema";

const admins = [
  {
    username: "Erika",
    password: "admin123",
    name: "Erika Alvarez",
  },
  {
    username: "admin",
    password: "admin123",
    name: "Administrador",
  },
];

async function main() {
  for (const admin of admins) {
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, admin.username),
    });

    if (existingUser) {
      console.log(`User "${admin.username}" already exists.`);
      continue;
    }

    const passwordHash = await argon2.hash(admin.password);

    await db.insert(users).values({
      name: admin.name,
      username: admin.username,
      passwordHash,
      role: "ADMIN",
    });

    console.log(`Admin "${admin.username}" created successfully.`);
    console.log(`Username: ${admin.username}`);
    console.log(`Password: ${admin.password}`);
  }
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
