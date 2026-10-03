import {
  boolean,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "EMPLOYEE"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),

  username: varchar("username", { length: 50 }).notNull().unique(),

  passwordHash: varchar("password_hash", { length: 255 }).notNull(),

  role: userRoleEnum("role").notNull().default("EMPLOYEE"),

  active: boolean("active").notNull().default(true),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});
