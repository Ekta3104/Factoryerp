-- Extend expenses table
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) CHECK (payment_type IN ('Cash', 'Bank', 'UPI')),
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS remarks TEXT,
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS entity_id UUID;

CREATE INDEX IF NOT EXISTS idx_expenses_entity ON expenses(entity_type, entity_id);

-- Drop duplicate columns from vehicle_inwards
ALTER TABLE vehicle_inwards
DROP COLUMN IF EXISTS diesel_expense,
DROP COLUMN IF EXISTS toll_expense,
DROP COLUMN IF EXISTS driver_expense,
DROP COLUMN IF EXISTS jcb_unloading_charges,
DROP COLUMN IF EXISTS jcb_diesel_charges;
