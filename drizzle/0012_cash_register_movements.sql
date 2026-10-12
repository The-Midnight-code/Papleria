CREATE TABLE "cash_register_movements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_date" date NOT NULL,
  "type" varchar(10) NOT NULL,
  "amount" numeric(12,2) NOT NULL,
  "reason" varchar(160) NOT NULL,
  "notes" varchar(1000),
  "created_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "cash_register_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "cash_register_movements_type_check" CHECK ("type" IN ('opening', 'in', 'out')),
  CONSTRAINT "cash_register_movements_amount_positive" CHECK ("amount" > 0)
);
CREATE INDEX "cash_register_movements_date_idx" ON "cash_register_movements" ("business_date", "created_at");
CREATE INDEX "cash_register_movements_type_date_idx" ON "cash_register_movements" ("type", "business_date");
ALTER TABLE "cash_closures" ADD COLUMN "opening_float" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "cash_closures" ADD COLUMN "cash_in" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "cash_closures" ADD COLUMN "cash_out" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "cash_closures" ADD COLUMN "cash_expected" numeric(12,2) DEFAULT 0 NOT NULL;
ALTER TABLE "cash_closures" ADD CONSTRAINT "cash_closures_opening_float_nonnegative" CHECK ("opening_float" >= 0);
ALTER TABLE "cash_closures" ADD CONSTRAINT "cash_closures_cash_in_nonnegative" CHECK ("cash_in" >= 0);
ALTER TABLE "cash_closures" ADD CONSTRAINT "cash_closures_cash_out_nonnegative" CHECK ("cash_out" >= 0);
ALTER TABLE "cash_closures" ADD CONSTRAINT "cash_closures_cash_expected_nonnegative" CHECK ("cash_expected" >= 0);
