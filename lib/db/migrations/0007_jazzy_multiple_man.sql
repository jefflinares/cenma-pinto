-- Remove the old unique constraint if it exists
ALTER TABLE trucks DROP CONSTRAINT IF EXISTS trucks_plate_unique;

-- Add a partial unique index for active trucks
CREATE UNIQUE INDEX trucks_plate_unique_active
ON trucks (plate)
WHERE deleted_at IS NULL;