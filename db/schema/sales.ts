import { boolean, check, index, integer, numeric, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { products } from "./products";

export const promotions = pgTable("promotions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
  discountType: varchar("discount_type", { length: 20 }).notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  active: boolean("active").notNull().default(true),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("promotions_discount_type_check", sql`${table.discountType} in ('percent', 'fixed')`),
  check("promotions_discount_value_positive", sql`${table.discountValue} > 0`),
  check("promotions_percent_max_check", sql`${table.discountType} <> 'percent' or ${table.discountValue} <= 100`),
  check("promotions_dates_check", sql`${table.endsAt} > ${table.startsAt}`),
  index("promotions_active_dates_idx").on(table.active, table.startsAt, table.endsAt),
  index("promotions_product_idx").on(table.productId),
]);

export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  folio: varchar("folio", { length: 40 }).notNull().unique(),
  idempotencyKey: varchar("idempotency_key", { length: 36 }),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  discountTotal: numeric("discount_total", { precision: 12, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  amountReceived: numeric("amount_received", { precision: 12, scale: 2 }).notNull(),
  changeDue: numeric("change_due", { precision: 12, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 20 }).notNull().default("completed"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancelledBy: uuid("cancelled_by").references(() => users.id, { onDelete: "set null" }),
  cancellationReason: varchar("cancellation_reason", { length: 500 }),
  notes: varchar("notes", { length: 500 }),
  soldBy: uuid("sold_by").references(() => users.id, { onDelete: "set null" }),
  soldAt: timestamp("sold_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("sales_payment_method_check", sql`${table.paymentMethod} in ('cash', 'card', 'transfer')`),
  check("sales_status_check", sql`${table.status} in ('completed', 'cancelled')`),
  check("sales_subtotal_nonnegative", sql`${table.subtotal} >= 0`),
  check("sales_discount_total_nonnegative", sql`${table.discountTotal} >= 0`),
  check("sales_total_nonnegative", sql`${table.total} >= 0`),
  check("sales_amount_received_nonnegative", sql`${table.amountReceived} >= 0`),
  check("sales_change_due_nonnegative", sql`${table.changeDue} >= 0`),
  uniqueIndex("sales_idempotency_key_unique").on(table.idempotencyKey),
  index("sales_sold_at_idx").on(table.soldAt),
  index("sales_sold_by_idx").on(table.soldBy),
  index("sales_payment_method_idx").on(table.paymentMethod),
]);

export const saleItems = pgTable("sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  saleId: uuid("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  productName: varchar("product_name", { length: 160 }).notNull(),
  sku: varchar("sku", { length: 60 }).notNull(),
  quantity: integer("quantity").notNull(),
  originalUnitPrice: numeric("original_unit_price", { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  promotionName: varchar("promotion_name", { length: 120 }),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
  lineCost: numeric("line_cost", { precision: 12, scale: 2 }).notNull(),
}, (table) => [
  check("sale_items_quantity_positive", sql`${table.quantity} > 0`),
  check("sale_items_original_unit_price_nonnegative", sql`${table.originalUnitPrice} >= 0`),
  check("sale_items_unit_price_nonnegative", sql`${table.unitPrice} >= 0`),
  check("sale_items_discount_amount_nonnegative", sql`${table.discountAmount} >= 0`),
  check("sale_items_unit_cost_nonnegative", sql`${table.unitCost} >= 0`),
  check("sale_items_line_total_nonnegative", sql`${table.lineTotal} >= 0`),
  check("sale_items_line_cost_nonnegative", sql`${table.lineCost} >= 0`),
  index("sale_items_sale_idx").on(table.saleId),
  index("sale_items_product_idx").on(table.productId),
]);
