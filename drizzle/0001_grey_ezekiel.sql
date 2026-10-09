CREATE TYPE "public"."service_order_status" AS ENUM('PENDING_QUOTE', 'AWAITING_DEPOSIT', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"image_data" "bytea",
	"image_mime_type" varchar(50),
	"price" numeric(10, 2),
	"requires_quote" boolean DEFAULT false NOT NULL,
	"estimated_days" integer,
	"published" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"service_id" uuid,
	"service_name" varchar(150) NOT NULL,
	"customer_name" varchar(150) NOT NULL,
	"customer_phone" varchar(30),
	"specifications" text,
	"agreed_price" numeric(10, 2),
	"deposit_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"status" "service_order_status" DEFAULT 'PENDING_QUOTE' NOT NULL,
	"requested_delivery_date" timestamp with time zone,
	"promised_delivery_date" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;