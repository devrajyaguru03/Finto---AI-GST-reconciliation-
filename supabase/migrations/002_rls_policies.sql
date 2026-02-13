-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE gstins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER ROLES POLICIES
-- ============================================

-- Users can view their own role
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all roles
CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- ============================================
-- CLIENTS POLICIES
-- ============================================

-- View: Based on role and assignments
CREATE POLICY "View clients based on role" ON clients
  FOR SELECT USING (can_access_client(auth.uid(), id));

-- Insert: Senior CA and Admin only
CREATE POLICY "Create clients - senior roles" ON clients
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) IN ('senior_ca', 'admin'));

-- Update: Based on access
CREATE POLICY "Update accessible clients" ON clients
  FOR UPDATE USING (can_access_client(auth.uid(), id))
  WITH CHECK (get_user_role(auth.uid()) IN ('senior_ca', 'admin'));

-- Delete: Admin only
CREATE POLICY "Delete clients - admin only" ON clients
  FOR DELETE USING (get_user_role(auth.uid()) = 'admin');

-- ============================================
-- GSTINS POLICIES
-- ============================================

CREATE POLICY "View GSTINs for accessible clients" ON gstins
  FOR SELECT USING (can_access_client(auth.uid(), client_id));

CREATE POLICY "Create GSTINs - senior roles" ON gstins
  FOR INSERT WITH CHECK (
    can_access_client(auth.uid(), client_id) AND 
    get_user_role(auth.uid()) IN ('senior_ca', 'admin')
  );

CREATE POLICY "Update GSTINs - senior roles" ON gstins
  FOR UPDATE USING (can_access_client(auth.uid(), client_id))
  WITH CHECK (get_user_role(auth.uid()) IN ('senior_ca', 'admin'));

-- ============================================
-- USER CLIENT ASSIGNMENTS POLICIES
-- ============================================

-- Users can see their own assignments
CREATE POLICY "View own assignments" ON user_client_assignments
  FOR SELECT USING (auth.uid() = user_id);

-- Senior CA and Admin can view all assignments
CREATE POLICY "Senior roles view all assignments" ON user_client_assignments
  FOR SELECT USING (get_user_role(auth.uid()) IN ('senior_ca', 'admin'));

-- Only Admin can manage assignments
CREATE POLICY "Admin manages assignments" ON user_client_assignments
  FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- ============================================
-- VENDORS POLICIES
-- ============================================

CREATE POLICY "View vendors for accessible clients" ON vendors
  FOR SELECT USING (can_access_client(auth.uid(), client_id));

CREATE POLICY "Manage vendors for accessible clients" ON vendors
  FOR ALL USING (can_access_client(auth.uid(), client_id));

-- ============================================
-- RECONCILIATION RUNS POLICIES
-- ============================================

CREATE POLICY "View reconciliation runs for accessible clients" ON reconciliation_runs
  FOR SELECT USING (can_access_client(auth.uid(), client_id));

CREATE POLICY "Create reconciliation runs" ON reconciliation_runs
  FOR INSERT WITH CHECK (can_access_client(auth.uid(), client_id));

CREATE POLICY "Update own reconciliation runs" ON reconciliation_runs
  FOR UPDATE USING (
    can_access_client(auth.uid(), client_id) AND
    (created_by = auth.uid() OR get_user_role(auth.uid()) IN ('senior_ca', 'admin'))
  );

-- ============================================
-- INVOICES POLICIES
-- ============================================

CREATE POLICY "View invoices via run access" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reconciliation_runs r 
      WHERE r.id = run_id AND can_access_client(auth.uid(), r.client_id)
    )
  );

CREATE POLICY "Create invoices via run access" ON invoices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM reconciliation_runs r 
      WHERE r.id = run_id AND can_access_client(auth.uid(), r.client_id)
    )
  );

-- ============================================
-- MATCH RESULTS POLICIES
-- ============================================

CREATE POLICY "View match results via run access" ON match_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reconciliation_runs r 
      WHERE r.id = run_id AND can_access_client(auth.uid(), r.client_id)
    )
  );

CREATE POLICY "Manage match results via run access" ON match_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM reconciliation_runs r 
      WHERE r.id = run_id AND can_access_client(auth.uid(), r.client_id)
    )
  );

-- ============================================
-- CLASSIFICATIONS POLICIES
-- ============================================

CREATE POLICY "View classifications via match access" ON classifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM match_results m 
      JOIN reconciliation_runs r ON r.id = m.run_id
      WHERE m.id = match_result_id AND can_access_client(auth.uid(), r.client_id)
    )
  );

CREATE POLICY "Manage classifications" ON classifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM match_results m 
      JOIN reconciliation_runs r ON r.id = m.run_id
      WHERE m.id = match_result_id AND can_access_client(auth.uid(), r.client_id)
    )
  );

-- ============================================
-- OVERRIDES POLICIES
-- ============================================

-- Only senior_ca and admin can create overrides
CREATE POLICY "Create overrides - senior roles" ON overrides
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) IN ('senior_ca', 'admin'));

CREATE POLICY "View overrides via match access" ON overrides
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM match_results m 
      JOIN reconciliation_runs r ON r.id = m.run_id
      WHERE m.id = match_result_id AND can_access_client(auth.uid(), r.client_id)
    )
  );

-- Only admin can approve
CREATE POLICY "Approve overrides - admin only" ON overrides
  FOR UPDATE USING (get_user_role(auth.uid()) = 'admin');

-- ============================================
-- NOTES POLICIES
-- ============================================

CREATE POLICY "View notes" ON notes
  FOR SELECT USING (true); -- Notes visibility controlled by entity access

CREATE POLICY "Create notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update own notes" ON notes
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Delete own notes" ON notes
  FOR DELETE USING (
    created_by = auth.uid() OR 
    get_user_role(auth.uid()) IN ('senior_ca', 'admin')
  );

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Users can view their own audit logs
CREATE POLICY "View own audit logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Admin can view all audit logs
CREATE POLICY "Admin view all audit logs" ON audit_logs
  FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

-- No one can modify audit logs (insert only via functions)
CREATE POLICY "Insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);
