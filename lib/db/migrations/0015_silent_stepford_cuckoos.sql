ALTER TABLE "income" ALTER COLUMN "date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "income" ALTER COLUMN "date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "customer_order_details" ADD COLUMN "income_detail_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "income_details" ADD COLUMN "remaining_quantity" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "customer_order_details" ADD CONSTRAINT "customer_order_details_income_detail_id_income_details_id_fk" FOREIGN KEY ("income_detail_id") REFERENCES "public"."income_details"("id") ON DELETE no action ON UPDATE no action;