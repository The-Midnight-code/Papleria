"use server";

import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db/db";
import { inventoryMovements, products, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";

export type MonthlyInventoryMovement = {
  id: string;
  productName: string;
  sku: string;
  type: string;
  reason: string;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  notes: string | null;
  createdAt: string;
  userName: string | null;
};

function tijuanaMidnightUtc(date: string) {
  const target = Date.parse(date + "T00:00:00.000Z");
  let guess = target;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Tijuana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = formatter.formatToParts(new Date(guess));
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
    const representedAsUtc = Date.UTC(
      get("year"), get("month") - 1, get("day"),
      get("hour"), get("minute"), get("second"),
    );
    const correction = target - representedAsUtc;
    guess += correction;
    if (correction === 0) break;
  }
  return new Date(guess);
}

function isValidMonth(value: string) {
  if (!/^\\d{4}-\\d{2}$/.test(value)) return false;
  const [year, month] = value.split("-").map(Number);
  return year >= 2000 && month >= 1 && month <= 12;
}

function nextMonthStart(month: string) {
  const [year, value] = month.split("-").map(Number);
  return year + (value === 12 ? 1 : 0) + "-" + String(value === 12 ? 1 : value + 1).padStart(2, "0") + "-01";
}

export async function getMonthlyInventoryReport(month: string): Promise<MonthlyInventoryMovement[]> {
  await requireAdmin();
  if (!isValidMonth(month)) throw new Error("Selecciona un mes válido.");

  const startDate = month + "-01";
  const endDate = nextMonthStart(month);
  const start = tijuanaMidnightUtc(startDate);
  const end = tijuanaMidnightUtc(endDate);

  const rows = await db.select({
    id: inventoryMovements.id,
    productName: products.name,
    sku: products.sku,
    type: inventoryMovements.type,
    reason: inventoryMovements.reason,
    quantity: inventoryMovements.quantity,
    stockBefore: inventoryMovements.stockBefore,
    stockAfter: inventoryMovements.stockAfter,
    notes: inventoryMovements.notes,
    createdAt: inventoryMovements.createdAt,
    userName: users.name,
  })
    .from(inventoryMovements)
    .innerJoin(products, eq(inventoryMovements.productId, products.id))
    .leftJoin(users, eq(inventoryMovements.userId, users.id))
    .where(and(gte(inventoryMovements.createdAt, start), lt(inventoryMovements.createdAt, end)))
    .orderBy(desc(inventoryMovements.createdAt));

  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}
