import { numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { serviceOrders } from "./service_orders";
import { users } from "./users";

export const serviceOrderPayments = pgTable("service_order_payments", {
  id: uuid("id").defaultRandom().primaryKey(),

  serviceOrderId: uuid("service_order_id")
    .notNull()
    .references(() => serviceOrders.id, { onDelete: "restrict" }),

  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),

  paymentMethod: text("payment_method").notNull(),

  notes: text("notes"),

  receivedBy: uuid("received_by").references(() => users.id, {
    onDelete: "set null",
  }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});
