ALTER TABLE "product_classifications" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "product_classifications" CASCADE;--> statement-breakpoint
--ALTER TABLE "customer_order_details" DROP CONSTRAINT "customer_order_details_classification_id_product_classifications_id_fk";
--> statement-breakpoint
--ALTER TABLE "income_details" DROP CONSTRAINT "income_details_classification_id_product_classifications_id_fk";
--> statement-breakpoint
ALTER TABLE "customer_order_details" DROP COLUMN "classification_id";--> statement-breakpoint
ALTER TABLE "income_details" DROP COLUMN "classification_id";