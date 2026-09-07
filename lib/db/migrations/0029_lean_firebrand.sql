-- Custom SQL migration file, put your code below! --

-- Add FK columns to cash_movements
ALTER TABLE "cash_movements"
  ADD COLUMN IF NOT EXISTS "payment_id" integer REFERENCES "payments"("id"),
  ADD COLUMN IF NOT EXISTS "provider_payment_id" integer REFERENCES "provider_payments"("id");

-- Create cash_day_summary table
CREATE TABLE IF NOT EXISTS "cash_day_summary" (
  "id" serial PRIMARY KEY,
  "date" date NOT NULL UNIQUE,
  "opening_balance" numeric(10, 2) NOT NULL,
  "closing_balance" numeric(10, 2),
  "closed_at" timestamp,
  "closed_by" integer REFERENCES "users"("id")
);
