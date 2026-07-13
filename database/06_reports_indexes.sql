-- ==========================================
-- PERFORMANCE INDEXES FOR REPORTS MODULE
-- ==========================================

-- Vehicle Inwards (time-based filtering)
CREATE INDEX IF NOT EXISTS idx_vehicle_inwards_entry_time ON vehicle_inwards(entry_time);

-- Production Batches (time and grouping)
CREATE INDEX IF NOT EXISTS idx_production_batches_start_time ON production_batches(start_time);
CREATE INDEX IF NOT EXISTS idx_production_batches_end_time ON production_batches(end_time);
CREATE INDEX IF NOT EXISTS idx_production_batches_shift ON production_batches(shift);
CREATE INDEX IF NOT EXISTS idx_production_batches_operator ON production_batches(operator_name);
CREATE INDEX IF NOT EXISTS idx_production_batches_machine ON production_batches(machine);

-- Dispatches (time-based and grouping)
CREATE INDEX IF NOT EXISTS idx_dispatches_dispatch_date ON dispatches(dispatch_date);
CREATE INDEX IF NOT EXISTS idx_dispatches_vehicle_number ON dispatches(vehicle_number);

-- Expenses (time-based and category)
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_entity ON expenses(entity_type, entity_id);
