ALTER TABLE "incomes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "incomes" CASCADE;--> statement-breakpoint
ALTER TABLE "income_details" DROP CONSTRAINT "income_details_container_id_containers_id_fk";
--> statement-breakpoint
ALTER TABLE "income_trucks" ADD COLUMN "date" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "income_details" DROP COLUMN "container_id";--> statement-breakpoint
ALTER TABLE "income_trucks" DROP COLUMN "income_id";