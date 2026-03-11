-- ============================================
-- Review photos: photos attached to reviews become the listing's gallery
-- ============================================

CREATE TABLE review_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_photos_review ON review_photos(review_id);
CREATE INDEX idx_review_photos_listing ON review_photos(listing_id);

-- RLS
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review photos are viewable by everyone"
  ON review_photos FOR SELECT USING (true);

CREATE POLICY "Users can upload photos with their reviews"
  ON review_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review photos"
  ON review_photos FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all review photos"
  ON review_photos FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
