ALTER TABLE "income_trucks" DROP CONSTRAINT "income_trucks_truck_plate_trucks_plate_fk";
--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'trucks'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "trucks" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "trucks" DROP CONSTRAINT "trucks_pkey";
ALTER TABLE "income_trucks" ADD COLUMN "truck_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "trucks" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "income_trucks" ADD CONSTRAINT "income_trucks_truck_id_trucks_id_fk" FOREIGN KEY ("truck_id") REFERENCES "public"."trucks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "income_trucks" DROP COLUMN "truck_plate";--> statement-breakpoint
ALTER TABLE "trucks" ADD CONSTRAINT "trucks_plate_unique" UNIQUE("plate");