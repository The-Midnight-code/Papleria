import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { reminders } from "./reminders";
import { users } from "./users";

export const userReminders = pgTable("user_reminders", {
  id: uuid("id").defaultRandom().primaryKey(),

  reminderId: uuid("reminder_id")
    .references(() => reminders.id, {
      onDelete: "cascade",
    })
    .notNull(),

  userId: uuid("user_id")
    .references(() => users.id, {
      onDelete: "cascade",
    })
    .notNull(),

  completedAt: timestamp("completed_at", {
    withTimezone: true,
  }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});
