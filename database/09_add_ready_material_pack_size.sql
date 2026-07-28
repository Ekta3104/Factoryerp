-- Migration 09: Track finished-goods stock in bags, not tons.
-- Ready materials are packed into fixed-size bags (25kg / 10kg). Production
-- batches now record "Quantity Produced" as a bag count; pack_size_kg lets
-- the server convert that to tons to scale the raw-material formula.

ALTER TABLE ready_materials
    ADD COLUMN IF NOT EXISTS pack_size_kg NUMERIC(10, 2);

INSERT INTO units (name, abbreviation)
VALUES ('Bags', 'bag')
ON CONFLICT (name) DO NOTHING;
