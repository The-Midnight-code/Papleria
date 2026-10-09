
CREATE TYPE "public"."delivery_status" AS ENUM (
  'PENDING',
  'DELIVERED'
);
--> statement-breakpoint

ALTER TABLE "list_clients"
ADD COLUMN "delivery_status" "delivery_status"
NOT NULL DEFAULT 'PENDING';
--> statement-breakpoint

ALTER TABLE "list_clients"
ADD COLUMN "delivered_at" timestamp with time zone;