ALTER TABLE "containers" DROP CONSTRAINT "containers_name_unique";

-- Add a partial unique index for active containers
CREATE UNIQUE INDEX containers_name_unique_active
ON containers (name)
WHERE deleted_at IS NULL;


ALTER TABLE "products" DROP CONSTRAINT "products_name_unique";
-- Add a partial unique index for active products
CREATE UNIQUE INDEX products_name_unique_active
ON products (name)
WHERE deleted_at IS NULL;