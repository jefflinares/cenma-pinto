ALTER TABLE "containers" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "containers" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "containers" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "customer_order_details" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_order_details" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_order_details" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "customer_orders" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_orders" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "customer_orders" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "income_details" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "income_details" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "income_details" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "income_details" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "income_trucks" ADD COLUMN "driver_name" varchar(100);--> statement-breakpoint
ALTER TABLE "income_trucks" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "income_trucks" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "income_trucks" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "incomes" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "incomes" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "incomes" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "product_classifications" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_classifications" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "product_classifications" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "income_details" ADD CONSTRAINT "income_details_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "containers" ADD CONSTRAINT "containers_name_unique" UNIQUE("name");