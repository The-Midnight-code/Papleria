import { jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import { users } from "./users";

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),

  userId: uuid("user_id").references(() => users.id, {
    onDelete: "set null",
  }),

  module: varchar("module", { length: 50 }).notNull(),

  action: varchar("action", { length: 100 }).notNull(),

  entityType: varchar("entity_type", { length: 50 }).notNull(),

  entityId: uuid("entity_id"),

  previousValue: varchar("previous_value", { length: 255 }),

  newValue: varchar("new_value", { length: 255 }),

  metadata: jsonb("metadata"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});
