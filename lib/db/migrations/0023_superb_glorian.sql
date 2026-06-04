ALTER TABLE "containers" ADD COLUMN "unit_price" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "containers" DROP COLUMN "capacity";--> statement-breakpoint
ALTER TABLE "containers" DROP COLUMN "unit";