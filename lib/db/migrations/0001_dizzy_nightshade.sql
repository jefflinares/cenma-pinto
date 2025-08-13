CREATE TABLE "cash_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"concept" text NOT NULL,
	"type" varchar(10) NOT NULL,
	"amount" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "containers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_order_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"classification_id" integer NOT NULL,
	"container_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"email" varchar(255),
	"address" text
);
--> statement-breakpoint
CREATE TABLE "income_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"income_truck_id" integer NOT NULL,
	"provider_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"classification_id" integer NOT NULL,
	"container_id" integer NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "income_trucks" (
	"id" serial PRIMARY KEY NOT NULL,
	"income_id" integer NOT NULL,
	"truck_plate" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_type" varchar(20) NOT NULL,
	"receipt_number" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "product_classifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"address" text
);
--> statement-breakpoint
CREATE TABLE "trucks" (
	"plate" varchar(20) PRIMARY KEY NOT NULL,
	"owner_id" integer
);
--> statement-breakpoint
ALTER TABLE "customer_accounts" ADD CONSTRAINT "customer_accounts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_details" ADD CONSTRAINT "customer_order_details_order_id_customer_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."customer_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_details" ADD CONSTRAINT "customer_order_details_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_details" ADD CONSTRAINT "customer_order_details_classification_id_product_classifications_id_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."product_classifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_order_details" ADD CONSTRAINT "customer_order_details_container_id_containers_id_fk" FOREIGN KEY ("container_id") REFERENCES "public"."containers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_details" ADD CONSTRAINT "income_details_income_truck_id_income_trucks_id_fk" FOREIGN KEY ("income_truck_id") REFERENCES "public"."income_trucks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_details" ADD CONSTRAINT "income_details_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_details" ADD CONSTRAINT "income_details_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_details" ADD CONSTRAINT "income_details_classification_id_product_classifications_id_fk" FOREIGN KEY ("classification_id") REFERENCES "public"."product_classifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_details" ADD CONSTRAINT "income_details_container_id_containers_id_fk" FOREIGN KEY ("container_id") REFERENCES "public"."containers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_trucks" ADD CONSTRAINT "income_trucks_income_id_incomes_id_fk" FOREIGN KEY ("income_id") REFERENCES "public"."incomes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_trucks" ADD CONSTRAINT "income_trucks_truck_plate_trucks_plate_fk" FOREIGN KEY ("truck_plate") REFERENCES "public"."trucks"("plate") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_classifications" ADD CONSTRAINT "product_classifications_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_owner_id_providers_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;