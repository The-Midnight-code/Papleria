CREATE TABLE "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(160) NOT NULL,
  "sku" varchar(60) NOT NULL,
  "category" varchar(100) NOT NULL,
  "description" text,
  "cost_price" numeric(10, 2) DEFAULT '0' NOT NULL,
  "sale_price" numeric(10, 2) NOT NULL,
  "stock_quantity" integer DEFAULT 0 NOT NULL,
  "min_stock" integer DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "products_sku_unique" UNIQUE("sku"),
  CONSTRAINT "products_cost_price_nonnegative" CHECK ("cost_price" >= 0),
  CONSTRAINT "products_sale_price_nonnegative" CHECK ("sale_price" >= 0),
  CONSTRAINT "products_stock_nonnegative" CHECK ("stock_quantity" >= 0),
  CONSTRAINT "products_min_stock_nonnegative" CHECK ("min_stock" >= 0)
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "products_name_idx" ON "products" USING btree ("name");
--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");
