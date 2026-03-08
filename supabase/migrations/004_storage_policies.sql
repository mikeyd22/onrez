-- ============================================
-- Storage bucket policies (run after creating bucket 'listing-photos')
-- ============================================

-- Anyone can view listing photos
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-photos');

-- Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listing-photos' AND auth.role() = 'authenticated');

-- Users can delete their own uploads (path starts with user_id)
CREATE POLICY "Users can delete own uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
