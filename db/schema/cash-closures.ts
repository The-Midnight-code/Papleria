import { check, date, index, numeric, pgTable, timestamp, uuid, varchar, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

export const cashRegisterMovements = pgTable("cash_register_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessDate: date("business_date").notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  reason: varchar("reason", { length: 160 }).notNull(),
  notes: varchar("notes", { length: 1000 }),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("cash_register_movements_type_check", sql`${table.type} IN ('opening', 'in', 'out')`),
  check("cash_register_movements_amount_positive", sql`${table.amount} > 0`),
  index("cash_register_movements_date_idx").on(table.businessDate, table.createdAt),
  index("cash_register_movements_type_date_idx").on(table.type, table.businessDate),
]);

export const cashClosures = pgTable("cash_closures", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessDate: date("business_date").notNull().unique(),
  closedAt: timestamp("closed_at", { withTimezone: true }).notNull().defaultNow(),
  closedBy: uuid("closed_by").references(() => users.id, { onDelete: "set null" }),
  salesCount: integer("sales_count").notNull(),
  cashTotal: numeric("cash_total", { precision: 12, scale: 2 }).notNull().default("0"),
  cardTotal: numeric("card_total", { precision: 12, scale: 2 }).notNull().default("0"),
  transferTotal: numeric("transfer_total", { precision: 12, scale: 2 }).notNull().default("0"),
  totalSales: numeric("total_sales", { precision: 12, scale: 2 }).notNull().default("0"),
  openingFloat: numeric("opening_float", { precision: 12, scale: 2 }).notNull().default("0"),
  cashIn: numeric("cash_in", { precision: 12, scale: 2 }).notNull().default("0"),
  cashOut: numeric("cash_out", { precision: 12, scale: 2 }).notNull().default("0"),
  cashExpected: numeric("cash_expected", { precision: 12, scale: 2 }).notNull().default("0"),
  cashCounted: numeric("cash_counted", { precision: 12, scale: 2 }).notNull(),
  difference: numeric("difference", { precision: 12, scale: 2 }).notNull(),
  notes: varchar("notes", { length: 1000 }),
}, (table) => [
  check("cash_closures_sales_count_nonnegative", sql`${table.salesCount} >= 0`),
  check("cash_closures_cash_total_nonnegative", sql`${table.cashTotal} >= 0`),
  check("cash_closures_card_total_nonnegative", sql`${table.cardTotal} >= 0`),
  check("cash_closures_transfer_total_nonnegative", sql`${table.transferTotal} >= 0`),
  check("cash_closures_total_sales_nonnegative", sql`${table.totalSales} >= 0`),
  check("cash_closures_opening_float_nonnegative", sql`${table.openingFloat} >= 0`),
  check("cash_closures_cash_in_nonnegative", sql`${table.cashIn} >= 0`),
  check("cash_closures_cash_out_nonnegative", sql`${table.cashOut} >= 0`),
  check("cash_closures_cash_expected_nonnegative", sql`${table.cashExpected} >= 0`),
  check("cash_closures_cash_counted_nonnegative", sql`${table.cashCounted} >= 0`),
  index("cash_closures_closed_at_idx").on(table.closedAt),
]);
