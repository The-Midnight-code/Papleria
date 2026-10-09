import { pgEnum, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { clients } from "./clients";
import { lists } from "./lists";

export const paymentStatusEnum = pgEnum("payment_status", ["UNPAID", "PAID"]);
export const deliveryStatusEnum = pgEnum("delivery_status", [
  "PENDING",
  "DELIVERED",
]);

export const listClients = pgTable(
  "list_clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    listId: uuid("list_id")
      .notNull()
      .references(() => lists.id, {
        onDelete: "cascade",
      }),

    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),

    paymentStatus: paymentStatusEnum("payment_status")
      .notNull()
      .default("UNPAID"),

    paidAt: timestamp("paid_at", {
      withTimezone: true,
    }),

    deliveryStatus: deliveryStatusEnum("delivery_status")
      .notNull()
      .default("PENDING"),

    deliveredAt: timestamp("delivered_at", {
      withTimezone: true,
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
  },
  (table) => [
    unique("list_clients_list_id_client_id_unique").on(
      table.listId,
      table.clientId,
    ),
  ],
);
