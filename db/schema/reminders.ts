import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { users } from "./users";

export const reminders = pgTable("reminders", {
  id: uuid("id").defaultRandom().primaryKey(),

  title: varchar("title", { length: 150 }).notNull(),

  message: varchar("message", { length: 500 }),

  scheduledAt: timestamp("scheduled_at", {
    withTimezone: true,
  }),

  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),

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
