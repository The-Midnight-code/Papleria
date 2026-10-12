import { boolean, integer, numeric, pgTable, text, timestamp, unique, uuid, varchar, check, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { users } from "./users";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    sku: varchar("sku", { length: 60 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    description: text("description"),
    costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull().default("0"),
    salePrice: numeric("sale_price", { precision: 10, scale: 2 }).notNull(),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    minStock: integer("min_stock").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("products_sku_unique").on(table.sku),
    check("products_cost_price_nonnegative", sql`${table.costPrice} >= 0`),
    check("products_sale_price_nonnegative", sql`${table.salePrice} >= 0`),
    check("products_stock_nonnegative", sql`${table.stockQuantity} >= 0`),
    check("products_min_stock_nonnegative", sql`${table.minStock} >= 0`),
    index("products_name_idx").on(table.name),
    index("products_category_idx").on(table.category),
  ],
);
