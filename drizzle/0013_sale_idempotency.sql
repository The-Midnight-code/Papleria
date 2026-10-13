ALTER TABLE "sales" ADD COLUMN "idempotency_key" varchar(36);
--> statement-breakpoint
CREATE UNIQUE INDEX "sales_idempotency_key_unique" ON "sales" USING btree ("idempotency_key");
