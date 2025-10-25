ALTER TABLE "income_trucks" RENAME TO "income";--> statement-breakpoint
ALTER TABLE "income_details" RENAME COLUMN "income_truck_id" TO "income_id";--> statement-breakpoint
ALTER TABLE "income_details" DROP CONSTRAINT "income_details_income_truck_id_income_trucks_id_fk";
--> statement-breakpoint
ALTER TABLE "income" DROP CONSTRAINT "income_trucks_truck_id_trucks_id_fk";
--> statement-breakpoint
ALTER TABLE "income_details" ADD CONSTRAINT "income_details_income_id_income_id_fk" FOREIGN KEY ("income_id") REFERENCES "public"."income"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income" DROP COLUMN "truck_id";--> statement-breakpoint
ALTER TABLE "income" DROP COLUMN "driver_name";