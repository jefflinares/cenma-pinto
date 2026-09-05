CREATE TYPE "public"."customer_order_status" AS ENUM('draft', 'pending', 'confirmed', 'paid');--> statement-breakpoint
ALTER TABLE "customer_orders" ADD COLUMN "status" "customer_order_status" NOT NULL DEFAULT 'pending';
