ALTER TABLE "sales"
  ADD COLUMN "cancelled_at" timestamptz,
  ADD COLUMN "cancelled_by" uuid,
  ADD COLUMN "cancellation_reason" varchar(500);

ALTER TABLE "sales"
  ADD CONSTRAINT "sales_cancelled_by_users_id_fk"
  FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE SET NULL;
