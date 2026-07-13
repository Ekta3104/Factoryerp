-- Revert productions table creation
DROP TABLE IF EXISTS productions;

-- Update the existing production_batches table to include requested fields
ALTER TABLE production_batches
ADD COLUMN IF NOT EXISTS production_date DATE,
ADD COLUMN IF NOT EXISTS shift VARCHAR(50) CHECK (shift IN ('Morning', 'Evening', 'Night')),
ADD COLUMN IF NOT EXISTS operator_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS machine VARCHAR(255),
ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Drop index from previous wrong table
DROP INDEX IF EXISTS idx_productions_raw_material;
DROP INDEX IF EXISTS idx_productions_ready_material;
DROP INDEX IF EXISTS idx_productions_date;
DROP INDEX IF EXISTS idx_productions_shift;
DROP INDEX IF EXISTS idx_productions_operator;

-- Add index to production_batches
CREATE INDEX IF NOT EXISTS idx_production_batches_date ON production_batches(production_date);
CREATE INDEX IF NOT EXISTS idx_production_batches_shift ON production_batches(shift);
CREATE INDEX IF NOT EXISTS idx_production_batches_operator ON production_batches(operator_name);
