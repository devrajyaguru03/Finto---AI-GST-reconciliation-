-- ============================================
-- Finto GST Reconciliation — Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    login_count INTEGER NOT NULL DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. OTP logs
CREATE TABLE IF NOT EXISTS otp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'verified', 'expired', 'failed')),
    ip_address TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    ip_address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Reconciliation runs
CREATE TABLE IF NOT EXISTS reconciliation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    pr_filename TEXT,
    gstr2b_filename TEXT,
    pr_invoices_count INTEGER NOT NULL DEFAULT 0,
    gstr2b_invoices_count INTEGER NOT NULL DEFAULT 0,
    total_records INTEGER NOT NULL DEFAULT 0,
    exact_match INTEGER NOT NULL DEFAULT 0,
    amount_mismatch INTEGER NOT NULL DEFAULT 0,
    date_mismatch INTEGER NOT NULL DEFAULT 0,
    gstin_mismatch INTEGER NOT NULL DEFAULT 0,
    pr_only INTEGER NOT NULL DEFAULT 0,
    gstr2b_only INTEGER NOT NULL DEFAULT 0,
    match_rate DECIMAL(5,1) NOT NULL DEFAULT 0,
    itc_claimable DECIMAL(15,2) NOT NULL DEFAULT 0,
    itc_at_risk DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_itc_available DECIMAL(15,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    email TEXT,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_logs_email ON otp_logs(email);
CREATE INDEX IF NOT EXISTS idx_otp_logs_created_at ON otp_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_created_at ON reconciliation_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Seed admin user
INSERT INTO users (email, role) VALUES ('devrajyaguru03@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Enable Row Level Security (but allow service_role to bypass)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies: service_role can do everything
CREATE POLICY "Service role full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON otp_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON reconciliation_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
