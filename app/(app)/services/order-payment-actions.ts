"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/db";
import { activityLogs, serviceOrderPayments, serviceOrders } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";

const paymentMethods = ["CASH", "CARD", "TRANSFER", "OTHER"] as const;

type PaymentMethod = (typeof paymentMethods)[number];

export async function registerServiceOrderPayment(
  orderId: string,
  formData: FormData,
) {
  try {
    const user = await requireEmployeeOrAdmin();

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        orderId,
      )
    ) {
      throw new Error("El identificador de la orden no es válido.");
    }

    const rawAmount = String(formData.get("amount") ?? "").trim();
    const amount = Number(rawAmount);
    const paymentMethod = String(
      formData.get("paymentMethod") ?? "",
    ) as PaymentMethod;
    const notes = String(formData.get("notes") ?? "").trim();

    if (
      !/^\d+(\.\d{1,2})?$/.test(rawAmount) ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error(
        "Ingresa un abono mayor que $0.00, con máximo dos decimales.",
      );
    }

    if (!(paymentMethods as readonly string[]).includes(paymentMethod)) {
      throw new Error("Selecciona un método de pago válido.");
    }

    if (notes.length > 500) {
      throw new Error("Las notas no pueden superar los 500 caracteres.");
    }

    await db.transaction(async (tx) => {
      // Bloquea la orden mientras se valida y registra el abono.
      const [order] = await tx
        .select({
          id: serviceOrders.id,
          orderNumber: serviceOrders.orderNumber,
          agreedPrice: serviceOrders.agreedPrice,
          depositAmount: serviceOrders.depositAmount,
          status: serviceOrders.status,
        })
        .from(serviceOrders)
        .where(eq(serviceOrders.id, orderId))
        .for("update");

      if (!order) {
        throw new Error("No se encontró la orden.");
      }

      if (order.status === "CANCELLED") {
        throw new Error("No puedes registrar pagos en una orden cancelada.");
      }

      if (order.agreedPrice === null) {
        throw new Error("Primero debes definir el precio acordado.");
      }

      const [result] = await tx
        .select({
          total: sql<string>`coalesce(sum(${serviceOrderPayments.amount}), 0)`,
        })
        .from(serviceOrderPayments)
        .where(eq(serviceOrderPayments.serviceOrderId, orderId));

      // El anticipo inicial se conserva en service_orders.
      // Esta tabla contiene únicamente los abonos adicionales.
      const totalPaid =
        Number(order.depositAmount) + Number(result?.total ?? 0);
      const price = Number(order.agreedPrice);
      const balance = Math.round((price - totalPaid) * 100) / 100;

      if (balance <= 0) {
        throw new Error("La orden ya está pagada por completo.");
      }

      if (amount > balance) {
        throw new Error(
          `El abono supera el saldo pendiente de $${balance.toFixed(2)}.`,
        );
      }

      await tx.insert(serviceOrderPayments).values({
        serviceOrderId: orderId,
        amount: amount.toFixed(2),
        paymentMethod,
        notes: notes || null,
        receivedBy: user.id,
      });

      await tx.insert(activityLogs).values({
        userId: user.id,
        module: "services",
        action: "REGISTER_SERVICE_ORDER_PAYMENT",
        entityType: "service_order",
        entityId: orderId,
        previousValue: totalPaid.toFixed(2),
        newValue: (totalPaid + amount).toFixed(2),
        metadata: {
          orderNumber: order.orderNumber,
          paymentAmount: amount.toFixed(2),
          paymentMethod,
          notes: notes || null,
          remainingBalance: (balance - amount).toFixed(2),
        },
      });
    });

    revalidatePath("/services/orders");
    revalidatePath(`/services/orders/${orderId}`);

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No se pudo registrar el abono.",
    };
  }
}
