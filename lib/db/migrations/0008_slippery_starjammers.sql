ALTER TABLE "containers" ADD COLUMN "capacity" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "containers" ADD COLUMN "unit" varchar(20) NOT NULL;