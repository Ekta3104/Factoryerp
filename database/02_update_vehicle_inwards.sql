-- Update vehicle_inwards table with missing expense fields
ALTER TABLE vehicle_inwards
ADD COLUMN IF NOT EXISTS diesel_expense NUMERIC(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS toll_expense NUMERIC(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS driver_expense NUMERIC(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS jcb_unloading_charges NUMERIC(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS jcb_diesel_charges NUMERIC(15, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS remarks TEXT;
