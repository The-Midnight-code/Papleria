"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/db/db";
import { services, activityLogs } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/authorization";

const MAX_IMAGE_SIZE = 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function uploadServiceImage(
  serviceId: string,
  formData: FormData,
) {
  const user = await requireAdmin();
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona una imagen." };
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return { error: "La imagen no puede superar 1 MB." };
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: "Usa una imagen JPEG, PNG o WebP." };
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  // Verifica la firma real del archivo, no solo su extensión o MIME.
  const isJpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;

  const isPng =
    bytes.length >= 8 &&
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

  const isWebp =
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP";

  const actualType = isJpeg
    ? "image/jpeg"
    : isPng
      ? "image/png"
      : isWebp
        ? "image/webp"
        : null;

  if (!actualType || actualType !== file.type) {
    return {
      error: "El contenido del archivo no coincide con el tipo de imagen.",
    };
  }

  const [existing] = await db
    .select({
      id: services.id,
      name: services.name,
    })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  if (!existing) {
    return { error: "El servicio no existe." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(services)
      .set({
        imageData: bytes,
        imageMimeType: actualType,
        updatedAt: new Date(),
      })
      .where(eq(services.id, serviceId));

    await tx.insert(activityLogs).values({
      userId: user.id,
      module: "SERVICES",
      action: "UPDATE_SERVICE_IMAGE",
      entityType: "SERVICE",
      entityId: serviceId,
      previousValue: null,
      newValue: existing.name,
      metadata: {
        mimeType: actualType,
        sizeBytes: bytes.length,
      },
    });
  });

  revalidatePath("/services");
  revalidatePath("/servicios");

  return { success: true };
}
