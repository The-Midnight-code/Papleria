CREATE TABLE "sales" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "folio" varchar(40) NOT NULL,
  "payment_method" varchar(20) NOT NULL,
  "subtotal" numeric(12, 2) NOT NULL,
  "total" numeric(12, 2) NOT NULL,
  "amount_received" numeric(12, 2) NOT NULL,
  "change_due" numeric(12, 2) DEFAULT '0' NOT NULL,
  "status" varchar(20) DEFAULT 'completed' NOT NULL,
  "notes" varchar(500),
  "sold_by" uuid,
  "sold_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "sales_payment_method_check" CHECK ("payment_method" in ('cash', 'card', 'transfer')),
  CONSTRAINT "sales_status_check" CHECK ("status" in ('completed', 'cancelled')),
  CONSTRAINT "sales_subtotal_nonnegative" CHECK ("subtotal" >= 0),
  CONSTRAINT "sales_total_nonnegative" CHECK ("total" >= 0),
  CONSTRAINT "sales_amount_received_nonnegative" CHECK ("amount_received" >= 0),
  CONSTRAINT "sales_change_due_nonnegative" CHECK ("change_due" >= 0)
);
--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_folio_unique" UNIQUE ("folio");
--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_sold_by_users_id_fk" FOREIGN KEY ("sold_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "sales_sold_at_idx" ON "sales" USING btree ("sold_at");
--> statement-breakpoint
CREATE INDEX "sales_sold_by_idx" ON "sales" USING btree ("sold_by");
--> statement-breakpoint
CREATE INDEX "sales_payment_method_idx" ON "sales" USING btree ("payment_method");
--> statement-breakpoint
CREATE TABLE "sale_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sale_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "product_name" varchar(160) NOT NULL,
  "sku" varchar(60) NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price" numeric(10, 2) NOT NULL,
  "unit_cost" numeric(10, 2) NOT NULL,
  "line_total" numeric(12, 2) NOT NULL,
  "line_cost" numeric(12, 2) NOT NULL,
  CONSTRAINT "sale_items_quantity_positive" CHECK ("quantity" > 0),
  CONSTRAINT "sale_items_unit_price_nonnegative" CHECK ("unit_price" >= 0),
  CONSTRAINT "sale_items_unit_cost_nonnegative" CHECK ("unit_cost" >= 0),
  CONSTRAINT "sale_items_line_total_nonnegative" CHECK ("line_total" >= 0),
  CONSTRAINT "sale_items_line_cost_nonnegative" CHECK ("line_cost" >= 0)
);
--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "sale_items_sale_idx" ON "sale_items" USING btree ("sale_id");
--> statement-breakpoint
CREATE INDEX "sale_items_product_idx" ON "sale_items" USING btree ("product_id");
