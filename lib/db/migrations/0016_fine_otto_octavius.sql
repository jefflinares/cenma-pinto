CREATE TYPE "public"."income_status" AS ENUM('draft', 'confirmed', 'settled');--> statement-breakpoint
CREATE TYPE "public"."provider_settlement_status" AS ENUM('draft', 'confirmed', 'paid');--> statement-breakpoint
CREATE TABLE "provider_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"settlement_id" integer NOT NULL,
	"date" timestamp DEFAULT now(),
	"amount" numeric(12, 2) NOT NULL,
	"payment_type" varchar(20) NOT NULL,
	"reference" varchar(100),
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "provider_settlement_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"settlement_id" integer NOT NULL,
	"income_detail_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "provider_settlement_expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"settlement_id" integer NOT NULL,
	"concept" varchar(100) NOT NULL,
	"amount" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_settlements" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" integer NOT NULL,
	"income_id" integer NOT NULL,
	"gross_amount" numeric(12, 2) NOT NULL,
	"commission_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"other_deductions" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_amount" numeric(12, 2) NOT NULL,
	"status" "provider_settlement_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "income" ADD COLUMN "status" "income_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "provider_payments" ADD CONSTRAINT "provider_payments_settlement_id_provider_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."provider_settlements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_payments" ADD CONSTRAINT "provider_payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_settlement_details" ADD CONSTRAINT "provider_settlement_details_settlement_id_provider_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."provider_settlements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_settlement_details" ADD CONSTRAINT "provider_settlement_details_income_detail_id_income_details_id_fk" FOREIGN KEY ("income_detail_id") REFERENCES "public"."income_details"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_settlement_expenses" ADD CONSTRAINT "provider_settlement_expenses_settlement_id_provider_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."provider_settlements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_settlements" ADD CONSTRAINT "provider_settlements_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_settlements" ADD CONSTRAINT "provider_settlements_income_id_income_id_fk" FOREIGN KEY ("income_id") REFERENCES "public"."income"("id") ON DELETE no action ON UPDATE no action;