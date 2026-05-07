ALTER TABLE "income_details" ALTER COLUMN "quantity" SET DATA TYPE integer USING quantity::integer;--> statement-breakpoint
ALTER TABLE "income_details" ALTER COLUMN "remaining_quantity" SET DATA TYPE integer USING remaining_quantity::integer;--> statement-breakpoint
ALTER TABLE "customer_order_details" ALTER COLUMN "quantity" SET DATA TYPE integer USING quantity::integer;
