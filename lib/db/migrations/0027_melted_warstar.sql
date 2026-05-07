ALTER TABLE "customer_order_details" DROP CONSTRAINT "customer_order_details_income_id_income_id_fk";
--> statement-breakpoint
ALTER TABLE "customer_orders" ADD COLUMN "income_id" integer;--> statement-breakpoint
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_income_id_income_id_fk" FOREIGN KEY ("income_id") REFERENCES "public"."income"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_details" DROP COLUMN "income_id";