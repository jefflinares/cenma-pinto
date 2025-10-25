ALTER TABLE "income_details" DROP CONSTRAINT "income_details_provider_id_providers_id_fk";
--> statement-breakpoint
ALTER TABLE "income" ADD COLUMN "provider_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "income" ADD CONSTRAINT "income_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_details" DROP COLUMN "provider_id";