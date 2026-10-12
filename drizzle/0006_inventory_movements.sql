CREATE TABLE "inventory_movements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "product_id" uuid NOT NULL,
  "user_id" uuid,
  "type" varchar(20) NOT NULL,
  "reason" varchar(40) NOT NULL,
  "quantity" integer NOT NULL,
  "stock_before" integer NOT NULL,
  "stock_after" integer NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "inventory_movements_type_check" CHECK ("type" in ('entry', 'exit', 'adjustment')),
  CONSTRAINT "inventory_movements_quantity_positive" CHECK ("quantity" > 0),
  CONSTRAINT "inventory_movements_stock_before_nonnegative" CHECK ("stock_before" >= 0),
  CONSTRAINT "inventory_movements_stock_after_nonnegative" CHECK ("stock_after" >= 0)
);
--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "inventory_movements_product_created_idx" ON "inventory_movements" USING btree ("product_id", "created_at");
--> statement-breakpoint
CREATE INDEX "inventory_movements_type_created_idx" ON "inventory_movements" USING btree ("type", "created_at");
