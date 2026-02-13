-- ============================================
-- Finto GST Reconciliation System
-- Database Schema - Initial Setup
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER ROLES & PERMISSIONS
-- ============================================

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('junior_ca', 'senior_ca', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================
-- CLIENTS & GSTINS
-- ============================================

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE gstins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  gstin TEXT NOT NULL,
  legal_name TEXT,
  trade_name TEXT,
  state_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(gstin)
);

-- User-Client assignments (for junior_ca access control)
CREATE TABLE user_client_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, client_id)
);

-- ============================================
-- VENDORS
-- ============================================

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  vendor_gstin TEXT NOT NULL,
  vendor_name TEXT,
  vendor_trade_name TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(client_id, vendor_gstin)
);

-- ============================================
-- RECONCILIATION RUNS
-- ============================================

CREATE TABLE reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  gstin_id UUID REFERENCES gstins(id) ON DELETE CASCADE,
  return_period TEXT NOT NULL, -- Format: 'MM-YYYY' e.g., '01-2024'
  financial_year TEXT NOT NULL, -- Format: 'YYYY-YY' e.g., '2023-24'
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'uploading', 'parsing', 'matching', 'completed', 'failed'
  )),
  
  -- File references (Supabase Storage paths)
  purchase_register_file TEXT,
  gstr2b_file TEXT,
  
  -- Stats
  total_pr_invoices INTEGER DEFAULT 0,
  total_gstr2b_invoices INTEGER DEFAULT 0,
  matched_count INTEGER DEFAULT 0,
  mismatch_count INTEGER DEFAULT 0,
  pr_only_count INTEGER DEFAULT 0,
  gstr2b_only_count INTEGER DEFAULT 0,
  
  -- Monetary totals
  total_pr_taxable DECIMAL(18,2) DEFAULT 0,
  total_gstr2b_taxable DECIMAL(18,2) DEFAULT 0,
  total_itc_claimed DECIMAL(18,2) DEFAULT 0,
  total_itc_available DECIMAL(18,2) DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INVOICES (Normalized from both sources)
-- ============================================

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES reconciliation_runs(id) ON DELETE CASCADE,
  
  -- Source identifier
  source TEXT NOT NULL CHECK (source IN ('purchase_register', 'gstr2b')),
  
  -- Invoice details
  invoice_no TEXT NOT NULL,
  invoice_date DATE,
  vendor_gstin TEXT,
  vendor_name TEXT,
  place_of_supply TEXT,
  
  -- Amounts
  taxable_value DECIMAL(18,2) DEFAULT 0,
  igst DECIMAL(12,2) DEFAULT 0,
  cgst DECIMAL(12,2) DEFAULT 0,
  sgst DECIMAL(12,2) DEFAULT 0,
  cess DECIMAL(12,2) DEFAULT 0,
  total_tax DECIMAL(12,2) DEFAULT 0,
  invoice_value DECIMAL(18,2) DEFAULT 0,
  
  -- GSTR-2B specific fields
  itc_available BOOLEAN DEFAULT true,
  itc_reason TEXT, -- Reason if ITC not available
  return_period TEXT,
  filing_date DATE,
  
  -- Original raw data for reference
  raw_data JSONB,
  row_number INTEGER, -- Original row in uploaded file
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster matching
CREATE INDEX idx_invoices_matching ON invoices(run_id, source, vendor_gstin, invoice_no);
CREATE INDEX idx_invoices_run_source ON invoices(run_id, source);

-- ============================================
-- MATCH RESULTS
-- ============================================

CREATE TABLE match_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES reconciliation_runs(id) ON DELETE CASCADE,
  
  -- Linked invoices (nullable for single-sided matches)
  pr_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  gstr2b_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- Match status
  match_status TEXT NOT NULL CHECK (match_status IN (
    'exact_match',      -- Perfect match
    'amount_mismatch',  -- GSTIN + Invoice match, amounts differ
    'date_mismatch',    -- GSTIN + Invoice match, dates differ
    'gstin_mismatch',   -- Invoice matched but GSTIN has issues
    'pr_only',          -- Only in Purchase Register
    'gstr2b_only',      -- Only in GSTR-2B
    'duplicate'         -- Potential duplicate
  )),
  
  -- Match quality
  confidence_score DECIMAL(5,2), -- 0-100
  match_rule_applied TEXT, -- Which rule matched this
  
  -- Discrepancy details
  taxable_diff DECIMAL(18,2) DEFAULT 0,
  igst_diff DECIMAL(12,2) DEFAULT 0,
  cgst_diff DECIMAL(12,2) DEFAULT 0,
  sgst_diff DECIMAL(12,2) DEFAULT 0,
  total_diff DECIMAL(18,2) DEFAULT 0,
  
  -- AI explanation (from Groq)
  ai_explanation TEXT,
  ai_suggestion TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_match_results_run ON match_results(run_id, match_status);

-- ============================================
-- CLASSIFICATIONS (CA decisions)
-- ============================================

CREATE TABLE classifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_result_id UUID REFERENCES match_results(id) ON DELETE CASCADE,
  
  category TEXT NOT NULL CHECK (category IN (
    'recoverable',        -- ITC can be claimed
    'irrecoverable',      -- ITC cannot be claimed
    'pending_vendor',     -- Waiting on vendor action
    'data_entry_error',   -- Our data entry mistake
    'timing_difference',  -- Will reconcile next period
    'under_review',       -- Under investigation
    'written_off'         -- Written off
  )),
  
  reason TEXT,
  action_required TEXT,
  due_date DATE,
  
  -- AI suggestion tracking
  ai_suggested BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(5,2),
  
  -- Audit trail
  classified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- OVERRIDES (Senior CA / Admin decisions)
-- ============================================

CREATE TABLE overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_result_id UUID REFERENCES match_results(id) ON DELETE CASCADE,
  
  original_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  reason TEXT NOT NULL,
  
  -- Approval workflow
  overridden_by UUID REFERENCES auth.users(id),
  approved BOOLEAN DEFAULT NULL, -- NULL = pending, true = approved, false = rejected
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- NOTES (Comments on any entity)
-- ============================================

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'client', 'gstin', 'vendor', 'reconciliation_run', 
    'invoice', 'match_result', 'classification'
  )),
  entity_id UUID NOT NULL,
  
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal note not shown to clients
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);

-- ============================================
-- AUDIT LOGS (Compliance & tracking)
-- ============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_role TEXT,
  
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'export', etc.
  entity_type TEXT,
  entity_id UUID,
  
  old_values JSONB,
  new_values JSONB,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = uid LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if user can access client
CREATE OR REPLACE FUNCTION can_access_client(uid UUID, cid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM user_roles WHERE user_id = uid;
  
  -- Admins and senior_ca can access all clients
  IF user_role IN ('admin', 'senior_ca') THEN
    RETURN true;
  END IF;
  
  -- Junior CA can only access assigned clients
  IF user_role = 'junior_ca' THEN
    RETURN EXISTS (
      SELECT 1 FROM user_client_assignments 
      WHERE user_id = uid AND client_id = cid
    );
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gstins_updated_at BEFORE UPDATE ON gstins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reconciliation_runs_updated_at BEFORE UPDATE ON reconciliation_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_results_updated_at BEFORE UPDATE ON match_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classifications_updated_at BEFORE UPDATE ON classifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
