CREATE TABLE "product_classification" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "product_classification_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "classification_id" integer;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_classification_id_product_classification_id_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."product_classification"("id") ON DELETE no action ON UPDATE no action;