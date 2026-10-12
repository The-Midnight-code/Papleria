import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/db";
import { services } from "@/db/schema";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [service] = await db
    .select({
      imageData: services.imageData,
      imageMimeType: services.imageMimeType,
    })
    .from(services)
    .where(eq(services.id, id))
    .limit(1);

  if (!service?.imageData || !service.imageMimeType) {
    return new NextResponse("Imagen no encontrada", { status: 404 });
  }

  return new NextResponse(new Uint8Array(service.imageData), {
    headers: {
      "Content-Type": service.imageMimeType,
      "Content-Length": String(service.imageData.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
