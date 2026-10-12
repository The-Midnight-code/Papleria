import { check, index, integer, numeric, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { products } from "./products";

export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  folio: varchar("folio", { length: 40 }).notNull().unique(),
  paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  amountReceived: numeric("amount_received", { precision: 12, scale: 2 }).notNull(),
  changeDue: numeric("change_due", { precision: 12, scale: 2 }).notNull().default("0"),
  status: varchar("status", { length: 20 }).notNull().default("completed"),
  notes: varchar("notes", { length: 500 }),
  soldBy: uuid("sold_by").references(() => users.id, { onDelete: "set null" }),
  soldAt: timestamp("sold_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("sales_payment_method_check", sql`${table.paymentMethod} in ('cash', 'card', 'transfer')`),
  check("sales_status_check", sql`${table.status} in ('completed', 'cancelled')`),
  check("sales_subtotal_nonnegative", sql`${table.subtotal} >= 0`),
  check("sales_total_nonnegative", sql`${table.total} >= 0`),
  check("sales_amount_received_nonnegative", sql`${table.amountReceived} >= 0`),
  check("sales_change_due_nonnegative", sql`${table.changeDue} >= 0`),
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
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
  lineCost: numeric("line_cost", { precision: 12, scale: 2 }).notNull(),
}, (table) => [
  check("sale_items_quantity_positive", sql`${table.quantity} > 0`),
  check("sale_items_unit_price_nonnegative", sql`${table.unitPrice} >= 0`),
  check("sale_items_unit_cost_nonnegative", sql`${table.unitCost} >= 0`),
  check("sale_items_line_total_nonnegative", sql`${table.lineTotal} >= 0`),
  check("sale_items_line_cost_nonnegative", sql`${table.lineCost} >= 0`),
  index("sale_items_sale_idx").on(table.saleId),
  index("sale_items_product_idx").on(table.productId),
]);
