-- PostgreSQL Migration: Salary & Universal Advance Management System

BEGIN;

-- 1. PARTY MASTER & CATEGORIES (Unified Party Architecture for Referential Integrity)
CREATE TABLE IF NOT EXISTS party_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO party_categories (code, name, description) VALUES 
('EMPLOYEE', 'Employee', 'Internal company staff and salaried workforce'),
('LABOUR', 'Worker / Labour', 'Daily wage factory floor workers'),
('CONTRACTOR', 'Contractor', 'Maintenance, civil, or specialized service contractors'),
('SUPPLIER', 'Vendor / Supplier', 'Raw material and equipment suppliers'),
('DRIVER', 'Driver', 'Logistics, transport, and delivery drivers'),
('TECHNICIAN', 'Technician', 'Equipment maintenance and machinery specialists'),
('CONSULTANT', 'Consultant', 'Legal, audit, tax, or technical advisers'),
('CUSTOMER', 'Customer', 'B2B buyers and trade clients'),
('OTHER', 'Other Person / Business', 'External individuals or third-party entities')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS parties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_code VARCHAR(50) UNIQUE NOT NULL,
    category_id UUID NOT NULL REFERENCES party_categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    tax_identifier VARCHAR(100), -- PAN / GSTIN / Aadhaar
    bank_account_number VARCHAR(100),
    bank_ifsc VARCHAR(50),
    bank_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employee Profile Table (Linked 1-to-1 with Party)
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    party_id UUID UNIQUE NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    designation VARCHAR(100),
    joining_date DATE,
    basic_salary NUMERIC(15, 2) DEFAULT 0.00 CHECK (basic_salary >= 0),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. SALARY MANAGEMENT MODULE
CREATE TABLE IF NOT EXISTS salary_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_name VARCHAR(100) NOT NULL, -- e.g. "August 2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PROCESSING', 'CLOSED', 'ARCHIVED')),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS salaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salary_cycle_id UUID NOT NULL REFERENCES salary_cycles(id) ON DELETE RESTRICT,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    gross_salary NUMERIC(15, 2) NOT NULL CHECK (gross_salary >= 0),
    bonus_allowance NUMERIC(15, 2) DEFAULT 0.00 CHECK (bonus_allowance >= 0),
    advance_deduction NUMERIC(15, 2) DEFAULT 0.00 CHECK (advance_deduction >= 0),
    other_deductions NUMERIC(15, 2) DEFAULT 0.00 CHECK (other_deductions >= 0),
    net_payable NUMERIC(15, 2) NOT NULL CHECK (net_payable >= 0),
    paid_amount NUMERIC(15, 2) DEFAULT 0.00 CHECK (paid_amount >= 0),
    pending_balance NUMERIC(15, 2) NOT NULL CHECK (pending_balance >= 0),
    payment_status VARCHAR(50) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'FULLY_PAID', 'CANCELLED')),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_net_payable_calculation CHECK (net_payable = (gross_salary + bonus_allowance - advance_deduction - other_deductions)),
    CONSTRAINT chk_pending_balance_calculation CHECK (pending_balance = (net_payable - paid_amount))
);

CREATE TABLE IF NOT EXISTS salary_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salary_id UUID NOT NULL REFERENCES salaries(id) ON DELETE RESTRICT,
    payment_number VARCHAR(100) UNIQUE NOT NULL,
    payment_date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER')),
    reference_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. UNIVERSAL ADVANCE MODULE
CREATE TABLE IF NOT EXISTS advance_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO advance_categories (name, description) VALUES
('Staff Loan / Personal Advance', 'Short term loan or advance given to internal staff'),
('Contractor Work Advance', 'Advance issued for project machinery maintenance or civil work'),
('Vendor Supply Advance', 'Advance payment for raw material orders'),
('Driver Travel & Fuel Advance', 'Disbursement for logistics, toll, and fuel expenses'),
('Emergency Aid', 'Medical or emergency relief advance'),
('General Business Advance', 'Misc enterprise advance')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS advances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advance_number VARCHAR(100) UNIQUE NOT NULL,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES advance_categories(id) ON DELETE RESTRICT,
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount > 0),
    adjusted_amount NUMERIC(15, 2) DEFAULT 0.00 CHECK (adjusted_amount >= 0),
    refunded_amount NUMERIC(15, 2) DEFAULT 0.00 CHECK (refunded_amount >= 0),
    outstanding_amount NUMERIC(15, 2) NOT NULL CHECK (outstanding_amount >= 0),
    disbursement_date DATE NOT NULL,
    reason TEXT NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER')),
    reference_number VARCHAR(100),
    project_work_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PARTIALLY_ADJUSTED', 'FULLY_ADJUSTED', 'REVERSED')),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_outstanding_calculation CHECK (outstanding_amount = (total_amount - adjusted_amount - refunded_amount))
);

CREATE TABLE IF NOT EXISTS advance_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advance_id UUID NOT NULL REFERENCES advances(id) ON DELETE RESTRICT,
    allocation_type VARCHAR(50) NOT NULL CHECK (allocation_type IN ('SALARY_DEDUCTION', 'VENDOR_INVOICE', 'EXPENSE_SETTLEMENT', 'DIRECT_REFUND')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    allocation_date DATE NOT NULL,
    target_salary_id UUID REFERENCES salaries(id) ON DELETE RESTRICT,
    target_expense_id UUID REFERENCES expenses(id) ON DELETE RESTRICT,
    reference_number VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. IMMUTABLE FINANCIAL LEDGER (SOURCE OF TRUTH)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number VARCHAR(100) UNIQUE NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT,
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN (
        'ADVANCE_DISBURSED', 
        'ADVANCE_ADJUSTED_SALARY', 
        'ADVANCE_ADJUSTED_EXPENSE', 
        'ADVANCE_REFUNDED', 
        'SALARY_RECORDED', 
        'SALARY_PAYMENT', 
        'REVERSAL'
    )),
    debit_amount NUMERIC(15, 2) DEFAULT 0.00 CHECK (debit_amount >= 0),
    credit_amount NUMERIC(15, 2) DEFAULT 0.00 CHECK (credit_amount >= 0),
    balance_after NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    idempotency_key VARCHAR(255) UNIQUE,
    related_advance_id UUID REFERENCES advances(id) ON DELETE RESTRICT,
    related_salary_id UUID REFERENCES salaries(id) ON DELETE RESTRICT,
    reversal_of_transaction_id UUID REFERENCES financial_transactions(id) ON DELETE RESTRICT,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PREVENT DIRECT DELETE OR UPDATE ON FINANCIAL LEDGER VIA TRIGGER
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Financial Ledger entries are immutable! Modification or deletion is strictly forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_financial_ledger ON financial_transactions;
CREATE TRIGGER trg_immutable_financial_ledger
BEFORE UPDATE OR DELETE ON financial_transactions
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_parties_category ON parties(category_id);
CREATE INDEX IF NOT EXISTS idx_parties_code ON parties(party_code);
CREATE INDEX IF NOT EXISTS idx_employees_party ON employees(party_id);
CREATE INDEX IF NOT EXISTS idx_salaries_cycle ON salaries(salary_cycle_id);
CREATE INDEX IF NOT EXISTS idx_salaries_party ON salaries(party_id);
CREATE INDEX IF NOT EXISTS idx_salaries_status ON salaries(payment_status);
CREATE INDEX IF NOT EXISTS idx_salary_payments_salary ON salary_payments(salary_id);
CREATE INDEX IF NOT EXISTS idx_advances_party ON advances(party_id);
CREATE INDEX IF NOT EXISTS idx_advances_status ON advances(status);
CREATE INDEX IF NOT EXISTS idx_advances_disbursement_date ON advances(disbursement_date);
CREATE INDEX IF NOT EXISTS idx_advance_allocations_advance ON advance_allocations(advance_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_party ON financial_transactions(party_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);

COMMIT;
