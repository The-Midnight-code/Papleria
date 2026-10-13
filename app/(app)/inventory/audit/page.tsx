import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/db";
import { inventoryMovements, products, purchaseItems, purchases } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";

type Finding = { severity: "error" | "warning"; title: string; detail: string };

export default async function InventoryAuditPage() {
  await requireAdmin();

  const [productRows, movementRows, purchaseRows, purchaseItemRows] = await Promise.all([
    db.select({ id: products.id, name: products.name, sku: products.sku, stockQuantity: products.stockQuantity })
      .from(products).orderBy(asc(products.name)),
    db.select({
      id: inventoryMovements.id, productId: inventoryMovements.productId, type: inventoryMovements.type,
      quantity: inventoryMovements.quantity, stockBefore: inventoryMovements.stockBefore,
      stockAfter: inventoryMovements.stockAfter, createdAt: inventoryMovements.createdAt,
    }).from(inventoryMovements).orderBy(desc(inventoryMovements.createdAt)),
    db.select({ id: purchases.id, reference: purchases.reference, supplierName: purchases.supplierName, totalAmount: purchases.totalAmount })
      .from(purchases),
    db.select({ purchaseId: purchaseItems.purchaseId, lineTotal: purchaseItems.lineTotal })
      .from(purchaseItems),
  ]);

  const findings: Finding[] = [];
  const latestMovement = new Map<string, (typeof movementRows)[number]>();
  const productsById = new Map(productRows.map((product) => [product.id, product]));

  for (const movement of movementRows) {
    if (!latestMovement.has(movement.productId)) latestMovement.set(movement.productId, movement);
    const product = productsById.get(movement.productId);
    if (!product) {
      findings.push({ severity: "error", title: "Movimiento sin producto", detail: "Movimiento " + movement.id + " referencia un producto inexistente." });
      continue;
    }
    const expected = movement.type === "entry"
      ? movement.stockBefore + movement.quantity
      : movement.type === "exit"
        ? movement.stockBefore - movement.quantity
        : movement.stockAfter;
    if (movement.type === "entry" && movement.stockAfter !== expected) {
      findings.push({ severity: "error", title: "Entrada inconsistente", detail: product.sku + " · movimiento " + movement.id + ": stock anterior + cantidad no coincide con stock posterior." });
    }
    if (movement.type === "exit" && (movement.stockAfter !== expected || movement.quantity > movement.stockBefore)) {
      findings.push({ severity: "error", title: "Salida inconsistente", detail: product.sku + " · movimiento " + movement.id + ": la cantidad no coincide con la variación de existencias." });
    }
    if (movement.type === "adjustment" && movement.quantity !== Math.abs(movement.stockAfter - movement.stockBefore)) {
      findings.push({ severity: "error", title: "Ajuste inconsistente", detail: product.sku + " · movimiento " + movement.id + ": la cantidad no coincide con la diferencia entre stocks." });
    }
    if (movement.stockBefore < 0 || movement.stockAfter < 0 || movement.quantity <= 0) {
      findings.push({ severity: "error", title: "Valores inválidos en movimiento", detail: product.sku + " · movimiento " + movement.id + " contiene existencias negativas o cantidad no positiva." });
    }
  }

  for (const product of productRows) {
    const latest = latestMovement.get(product.id);
    if (!latest) {
      if (product.stockQuantity !== 0) findings.push({
        severity: "warning", title: "Stock sin historial de movimientos",
        detail: product.sku + " · " + product.name + " tiene " + product.stockQuantity + " unidades, pero no tiene movimientos registrados.",
      });
    } else if (latest.stockAfter !== product.stockQuantity) {
      findings.push({
        severity: "error", title: "Stock actual distinto al último movimiento",
        detail: product.sku + " · " + product.name + ": producto=" + product.stockQuantity + ", último movimiento=" + latest.stockAfter + ".",
      });
    }
  }

  const totalsByPurchase = new Map<string, number>();
  for (const item of purchaseItemRows) {
    totalsByPurchase.set(item.purchaseId, (totalsByPurchase.get(item.purchaseId) ?? 0) + Math.round(Number(item.lineTotal) * 100));
  }
  for (const purchase of purchaseRows) {
    const itemsTotal = totalsByPurchase.get(purchase.id);
    if (itemsTotal === undefined) {
      findings.push({ severity: "error", title: "Compra sin partidas", detail: (purchase.reference || purchase.id) + " · proveedor " + purchase.supplierName + " no tiene partidas registradas." });
    } else if (Math.round(Number(purchase.totalAmount) * 100) !== itemsTotal) {
      findings.push({
        severity: "error", title: "Total de compra no coincide",
        detail: (purchase.reference || purchase.id) + " · cabecera=" + Number(purchase.totalAmount).toFixed(2) + ", partidas=" + (itemsTotal / 100).toFixed(2) + ".",
      });
    }
  }

  const errors = findings.filter((item) => item.severity === "error").length;
  const warnings = findings.filter((item) => item.severity === "warning").length;

  return <main className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
    <header>
      <Link href="/inventory" className="text-sm text-white/75 transition hover:text-white">← Volver al inventario</Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Auditoría de consistencia</h1>
      <p className="mt-1 text-sm text-white/75">Revisión de solo lectura de existencias, movimientos y totales de compras. No modifica datos.</p>
    </header>
    <section className="grid gap-3 sm:grid-cols-3">
      <article className="rounded-xl border border-white/30 bg-white p-4"><p className="text-sm text-gray-500">Productos revisados</p><p className="mt-1 text-2xl font-bold text-gray-900">{productRows.length}</p></article>
      <article className="rounded-xl border border-white/30 bg-white p-4"><p className="text-sm text-gray-500">Errores</p><p className={"mt-1 text-2xl font-bold " + (errors ? "text-red-700" : "text-emerald-700")}>{errors}</p></article>
      <article className="rounded-xl border border-white/30 bg-white p-4"><p className="text-sm text-gray-500">Advertencias</p><p className={"mt-1 text-2xl font-bold " + (warnings ? "text-amber-700" : "text-emerald-700")}>{warnings}</p></article>
    </section>
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-md sm:p-6">
      <div><h2 className="text-lg font-bold text-gray-900">Hallazgos</h2><p className="text-sm text-gray-500">Se revisaron {movementRows.length} movimientos y {purchaseRows.length} compras.</p></div>
      {findings.length === 0
        ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-5 text-sm font-medium text-emerald-800">No se detectaron inconsistencias en las comprobaciones realizadas.</p>
        : <ul className="space-y-3">{findings.map((item, index) => <li key={index} className={"rounded-lg border px-4 py-3 " + (item.severity === "error" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50")}><p className={"font-semibold " + (item.severity === "error" ? "text-red-900" : "text-amber-900")}>{item.title}</p><p className={"mt-1 text-sm " + (item.severity === "error" ? "text-red-800" : "text-amber-800")}>{item.detail}</p></li>)}</ul>}
      <p className="text-xs text-gray-500">Esta revisión detecta inconsistencias observables en los registros actuales; no demuestra por sí sola que cada movimiento histórico haya ocurrido físicamente. No se corrigen ni eliminan registros automáticamente.</p>
    </section>
  </main>;
}
