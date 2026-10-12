import { sql } from "drizzle-orm";
import {
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
  date,
  pgSequence,
} from "drizzle-orm/pg-core";

import { services } from "./services";
import { users } from "./users";

export const serviceOrderNumberSeq = pgSequence("service_order_number_seq", {
  startWith: 1,
  increment: 1,
});

export const serviceOrderStatusEnum = pgEnum("service_order_status", [
  "PENDING_QUOTE",
  "AWAITING_DEPOSIT",
  "IN_PROGRESS",
  "READY",
  "DELIVERED",
  "CANCELLED",
]);

export const serviceOrders = pgTable(
  "service_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    orderNumber: varchar("order_number", { length: 20 })
      .notNull()
      .default(
        sql`'SRV-' || lpad(nextval('service_order_number_seq')::text, 4, '0')`,
      ),

    serviceId: uuid("service_id").references(() => services.id, {
      onDelete: "set null",
    }),

    serviceName: varchar("service_name", { length: 150 }).notNull(),

    customerName: varchar("customer_name", { length: 150 }).notNull(),

    customerPhone: varchar("customer_phone", { length: 30 }),

    specifications: text("specifications"),

    agreedPrice: numeric("agreed_price", {
      precision: 10,
      scale: 2,
    }),

    depositAmount: numeric("deposit_amount", {
      precision: 10,
      scale: 2,
    })
      .notNull()
      .default("0"),

    status: serviceOrderStatusEnum("status").notNull().default("PENDING_QUOTE"),

    requestedDeliveryDate: date("requested_delivery_date"),
    promisedDeliveryDate: date("promised_delivery_date"),

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
  },
  (table) => [
    unique("service_orders_order_number_unique").on(table.orderNumber),
  ],
);
