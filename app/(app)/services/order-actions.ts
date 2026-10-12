"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/db";
import { activityLogs, serviceOrders, services } from "@/db/schema";
import { requireEmployeeOrAdmin } from "@/lib/auth/authorization";

function getOptionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseMoney(value: string, fieldName: string): string | null {
  const normalized = value.trim();

  if (!normalized) return null;

  if (!/^\d{1,8}(\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`${fieldName} debe ser un importe válido.`);
  }

  return Number(normalized).toFixed(2);
}

function parseDate(value: string, fieldName: string): string | null {
  const normalized = value.trim();

  if (!normalized) return null;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`${fieldName} no es válida.`);
  }

  const date = new Date(`${normalized}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== normalized
  ) {
    throw new Error(`${fieldName} no es válida.`);
  }

  return normalized;
}

export async function createServiceOrder(formData: FormData) {
  try {
    const user = await requireEmployeeOrAdmin();

    const serviceId = String(formData.get("serviceId") ?? "").trim();
    const customerName = String(formData.get("customerName") ?? "").trim();
    const customerPhone = getOptionalText(formData.get("customerPhone"));
    const specifications = getOptionalText(formData.get("specifications"));

    if (!serviceId) {
      return { error: "Selecciona un servicio." };
    }

    if (!customerName || customerName.length > 150) {
      return {
        error:
          "El nombre del cliente es obligatorio y admite hasta 150 caracteres.",
      };
    }

    if (customerPhone && customerPhone.length > 30) {
      return { error: "El teléfono admite hasta 30 caracteres." };
    }

    if (specifications && specifications.length > 5000) {
      return { error: "Las especificaciones admiten hasta 5000 caracteres." };
    }

    const [service] = await db
      .select({
        id: services.id,
        name: services.name,
        price: services.price,
        requiresQuote: services.requiresQuote,
        active: services.active,
      })
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.active, true)))
      .limit(1);

    if (!service) {
      return { error: "El servicio no existe o está inactivo." };
    }

    const agreedPrice = parseMoney(
      String(formData.get("agreedPrice") ?? ""),
      "El precio acordado",
    );

    const depositAmount =
      parseMoney(String(formData.get("depositAmount") ?? "0"), "El anticipo") ??
      "0.00";

    const requestedDeliveryDate = parseDate(
      String(formData.get("requestedDeliveryDate") ?? ""),
      "La fecha solicitada",
    );

    const promisedDeliveryDate = parseDate(
      String(formData.get("promisedDeliveryDate") ?? ""),
      "La fecha prometida",
    );

    if (
      requestedDeliveryDate &&
      promisedDeliveryDate &&
      promisedDeliveryDate < requestedDeliveryDate
    ) {
      return {
        error: "La fecha prometida no puede ser anterior a la solicitada.",
      };
    }

    if (agreedPrice === null && Number(depositAmount) > 0) {
      return {
        error: "No puedes registrar un anticipo sin un precio acordado.",
      };
    }

    if (agreedPrice !== null && Number(depositAmount) > Number(agreedPrice)) {
      return {
        error: "El anticipo no puede superar el precio acordado.",
      };
    }

    const status = agreedPrice === null ? "PENDING_QUOTE" : "AWAITING_DEPOSIT";

    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(serviceOrders)
        .values({
          serviceId: service.id,
          serviceName: service.name,
          customerName,
          customerPhone,
          specifications,
          agreedPrice,
          depositAmount,
          status,
          requestedDeliveryDate,
          promisedDeliveryDate,
          createdBy: user.id,
        })
        .returning({
          id: serviceOrders.id,
          orderNumber: serviceOrders.orderNumber,
          status: serviceOrders.status,
        });

      await tx.insert(activityLogs).values({
        userId: user.id,
        module: "services",
        action: "CREATE_SERVICE_ORDER",
        entityType: "service_order",
        entityId: order.id,
        newValue: order.orderNumber,
        metadata: {
          orderNumber: order.orderNumber,
          serviceName: service.name,
          customerName,
          status: order.status,
          agreedPrice,
          depositAmount,
        },
      });

      return order;
    });

    revalidatePath("/services");
    revalidatePath("/services/orders");

    return {
      success: true,
      order: result,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "No fue posible crear la orden de servicio." };
  }
}

const allowedTransitions = {
  PENDING_QUOTE: ["AWAITING_DEPOSIT", "CANCELLED"],
  AWAITING_DEPOSIT: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["READY", "CANCELLED"],
  READY: ["DELIVERED", "IN_PROGRESS", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
} as const;

type OrderStatus = keyof typeof allowedTransitions;

const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING_QUOTE: "Pendiente de cotización",
  AWAITING_DEPOSIT: "Esperando anticipo",
  IN_PROGRESS: "En proceso",
  READY: "Listo para entregar",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export async function updateServiceOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
) {
  try {
    const user = await requireEmployeeOrAdmin();

    if (
      typeof orderId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        orderId,
      )
    ) {
      return { error: "La orden seleccionada no es válida." };
    }

    if (
      typeof nextStatus !== "string" ||
      !Object.hasOwn(allowedTransitions, nextStatus)
    ) {
      return { error: "El estado seleccionado no es válido." };
    }

    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .select()
        .from(serviceOrders)
        .where(eq(serviceOrders.id, orderId))
        .limit(1);

      if (!order) {
        throw new Error("La orden no existe.");
      }

      const currentStatus = order.status as OrderStatus;

      if (!allowedTransitions[currentStatus].includes(nextStatus as never)) {
        throw new Error(
          `No se permite cambiar de "${orderStatusLabels[currentStatus]}" a "${orderStatusLabels[nextStatus]}".`,
        );
      }

      if (nextStatus === "AWAITING_DEPOSIT" && order.agreedPrice === null) {
        throw new Error("Registra el precio acordado antes de avanzar.");
      }

      if (nextStatus === "IN_PROGRESS" && order.agreedPrice === null) {
        throw new Error(
          "Debes definir el precio acordado antes de iniciar el trabajo.",
        );
      }

      if (
        Number(order.depositAmount) < 0 ||
        (order.agreedPrice !== null &&
          Number(order.depositAmount) > Number(order.agreedPrice))
      ) {
        throw new Error(
          "El anticipo debe estar entre $0 y el precio acordado.",
        );
      }

      const [updatedOrder] = await tx
        .update(serviceOrders)
        .set({
          status: nextStatus,
          updatedAt: new Date(),
        })
        .where(eq(serviceOrders.id, orderId))
        .returning({
          id: serviceOrders.id,
          orderNumber: serviceOrders.orderNumber,
          status: serviceOrders.status,
        });

      await tx.insert(activityLogs).values({
        userId: user.id,
        module: "services",
        action: "UPDATE_SERVICE_ORDER_STATUS",
        entityType: "service_order",
        entityId: order.id,
        previousValue: currentStatus,
        newValue: nextStatus,
        metadata: {
          orderNumber: order.orderNumber,
          previousStatus: currentStatus,
          newStatus: nextStatus,
        },
      });

      return updatedOrder;
    });

    revalidatePath("/services/orders");
    revalidatePath(`/services/orders/${orderId}`);

    return { success: true, order: result };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "No fue posible actualizar el estado de la orden.",
    };
  }
}
