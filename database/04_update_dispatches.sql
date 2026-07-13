-- Update dispatches table to include new requested fields
ALTER TABLE dispatches
ADD COLUMN IF NOT EXISTS driver_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS destination VARCHAR(255),
ADD COLUMN IF NOT EXISTS remarks TEXT;
