-- Migration 08: Multi-material production formulas (BOM)
-- Adds reusable formulas (a ready material's raw-material recipe) and
-- per-batch ingredient records, so a production batch can consume
-- several raw materials instead of just one.

CREATE TABLE IF NOT EXISTS product_formulas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    ready_material_id UUID NOT NULL REFERENCES ready_materials(id) ON DELETE RESTRICT,
    output_quantity NUMERIC(15, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS formula_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formula_id UUID NOT NULL REFERENCES product_formulas(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
    quantity NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_batch_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_batch_id UUID NOT NULL REFERENCES production_batches(id) ON DELETE CASCADE,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
    quantity_used NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE production_batches
    ADD COLUMN IF NOT EXISTS formula_id UUID REFERENCES product_formulas(id) ON DELETE RESTRICT;

ALTER TABLE production_batches
    ALTER COLUMN quantity_used DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_formula_ingredients_formula ON formula_ingredients(formula_id);
CREATE INDEX IF NOT EXISTS idx_formula_ingredients_raw_material ON formula_ingredients(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_product_formulas_ready_material ON product_formulas(ready_material_id);
CREATE INDEX IF NOT EXISTS idx_production_batch_materials_batch ON production_batch_materials(production_batch_id);
CREATE INDEX IF NOT EXISTS idx_production_batch_materials_raw_material ON production_batch_materials(raw_material_id);
CREATE INDEX IF NOT EXISTS idx_production_batches_formula ON production_batches(formula_id);
