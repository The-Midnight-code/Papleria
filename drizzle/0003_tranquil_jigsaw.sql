CREATE SEQUENCE IF NOT EXISTS "public"."service_order_number_seq"
  INCREMENT BY 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START WITH 1
  CACHE 1;

--> statement-breakpoint

ALTER TABLE "service_orders"
  ALTER COLUMN "order_number"
  SET DEFAULT 'SRV-' || lpad(nextval('public.service_order_number_seq')::text, 4, '0');

--> statement-breakpoint

SELECT setval(
  'public.service_order_number_seq',
  GREATEST(
    COALESCE(
      (
        SELECT MAX(
          CASE
            WHEN order_number ~ '^SRV-[0-9]+$'
            THEN substring(order_number FROM 5)::bigint
            ELSE NULL
          END
        )
        FROM service_orders
      ),
      0
    ) + 1,
    1
  ),
  false
);