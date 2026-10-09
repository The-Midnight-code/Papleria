import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  customType,
} from "drizzle-orm/pg-core";

import { users } from "./users";

const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return "bytea";
  },
});

export const services = pgTable("services", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 150 }).notNull(),

  description: text("description"),

  category: varchar("category", { length: 100 }).notNull(),

  imageData: bytea("image_data"),

  imageMimeType: varchar("image_mime_type", { length: 50 }),

  price: numeric("price", {
    precision: 10,
    scale: 2,
  }),

  requiresQuote: boolean("requires_quote").notNull().default(false),

  estimatedDays: integer("estimated_days"),

  published: boolean("published").notNull().default(false),

  active: boolean("active").notNull().default(true),

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
