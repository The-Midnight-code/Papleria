import { check, index, integer, numeric, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { products } from "./products";

export const purchases = pgTable("purchases", {
  id: uuid("id").defaultRandom().primaryKey(),
  supplierName: varchar("supplier_name", { length: 160 }).notNull(),
  reference: varchar("reference", { length: 100 }),
  notes: text("notes"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("purchases_total_nonnegative", sql`${table.totalAmount} >= 0`),
  index("purchases_purchased_at_idx").on(table.purchasedAt),
  index("purchases_supplier_idx").on(table.supplierName),
]);

export const purchaseItems = pgTable("purchase_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  purchaseId: uuid("purchase_id").notNull().references(() => purchases.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  unitCost: numeric("unit_cost", { precision: 10, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 12, scale: 2 }).notNull(),
}, (table) => [
  check("purchase_items_quantity_positive", sql`${table.quantity} > 0`),
  check("purchase_items_unit_cost_nonnegative", sql`${table.unitCost} >= 0`),
  check("purchase_items_line_total_nonnegative", sql`${table.lineTotal} >= 0`),
  index("purchase_items_purchase_idx").on(table.purchaseId),
  index("purchase_items_product_idx").on(table.productId),
]);
