import { check, index, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { products } from "./products";
import { users } from "./users";

export const inventoryMovements = pgTable("inventory_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  type: varchar("type", { length: 20 }).notNull(),
  reason: varchar("reason", { length: 40 }).notNull(),
  quantity: integer("quantity").notNull(),
  stockBefore: integer("stock_before").notNull(),
  stockAfter: integer("stock_after").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check("inventory_movements_type_check", sql`${table.type} in ('entry', 'exit', 'adjustment')`),
  check("inventory_movements_quantity_positive", sql`${table.quantity} > 0`),
  check("inventory_movements_stock_before_nonnegative", sql`${table.stockBefore} >= 0`),
  check("inventory_movements_stock_after_nonnegative", sql`${table.stockAfter} >= 0`),
  index("inventory_movements_product_created_idx").on(table.productId, table.createdAt),
  index("inventory_movements_type_created_idx").on(table.type, table.createdAt),
]);
