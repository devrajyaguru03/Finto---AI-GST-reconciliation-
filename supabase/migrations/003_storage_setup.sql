-- ============================================
-- Storage Buckets Setup
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================

-- Create buckets for file storage
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('uploads', 'uploads', false),
  ('reports', 'reports', false);

-- ============================================
-- Storage Policies
-- ============================================

-- UPLOADS BUCKET: Purchase Register & GSTR-2B files

-- Users can upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'uploads');

-- Users can view their uploads (via reconciliation run access)
CREATE POLICY "View uploads via run access" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'uploads');

-- Users can delete their own uploads
CREATE POLICY "Delete own uploads" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- REPORTS BUCKET: Generated PDF reports

CREATE POLICY "Authenticated users can access reports" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'reports');

CREATE POLICY "System can create reports" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'reports');
