CREATE TABLE "cash_closures" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "business_date" date NOT NULL,
  "closed_at" timestamptz DEFAULT now() NOT NULL,
  "closed_by" uuid,
  "sales_count" integer NOT NULL,
  "cash_total" numeric(12,2) DEFAULT 0 NOT NULL,
  "card_total" numeric(12,2) DEFAULT 0 NOT NULL,
  "transfer_total" numeric(12,2) DEFAULT 0 NOT NULL,
  "total_sales" numeric(12,2) DEFAULT 0 NOT NULL,
  "cash_counted" numeric(12,2) NOT NULL,
  "difference" numeric(12,2) NOT NULL,
  "notes" varchar(1000),
  CONSTRAINT "cash_closures_closed_by_users_id_fk" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE SET NULL,
  CONSTRAINT "cash_closures_sales_count_nonnegative" CHECK ("sales_count" >= 0),
  CONSTRAINT "cash_closures_cash_total_nonnegative" CHECK ("cash_total" >= 0),
  CONSTRAINT "cash_closures_card_total_nonnegative" CHECK ("card_total" >= 0),
  CONSTRAINT "cash_closures_transfer_total_nonnegative" CHECK ("transfer_total" >= 0),
  CONSTRAINT "cash_closures_total_sales_nonnegative" CHECK ("total_sales" >= 0),
  CONSTRAINT "cash_closures_cash_counted_nonnegative" CHECK ("cash_counted" >= 0)
);
CREATE UNIQUE INDEX "cash_closures_business_date_unique" ON "cash_closures" ("business_date");
CREATE INDEX "cash_closures_closed_at_idx" ON "cash_closures" ("closed_at");
