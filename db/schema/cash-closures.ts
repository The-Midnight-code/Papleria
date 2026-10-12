import { check, date, index, numeric, pgTable, timestamp, uuid, varchar, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

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
  cashCounted: numeric("cash_counted", { precision: 12, scale: 2 }).notNull(),
  difference: numeric("difference", { precision: 12, scale: 2 }).notNull(),
  notes: varchar("notes", { length: 1000 }),
}, (table) => [
  check("cash_closures_sales_count_nonnegative", sql`${table.salesCount} >= 0`),
  check("cash_closures_cash_total_nonnegative", sql`${table.cashTotal} >= 0`),
  check("cash_closures_card_total_nonnegative", sql`${table.cardTotal} >= 0`),
  check("cash_closures_transfer_total_nonnegative", sql`${table.transferTotal} >= 0`),
  check("cash_closures_total_sales_nonnegative", sql`${table.totalSales} >= 0`),
  check("cash_closures_cash_counted_nonnegative", sql`${table.cashCounted} >= 0`),
  index("cash_closures_closed_at_idx").on(table.closedAt),
]);
