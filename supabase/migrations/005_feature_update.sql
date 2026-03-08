-- ============================================
-- Feature update: residency status, title optional, university reviews
-- ============================================

-- Listings: add residency and last-stayed columns; make title optional
ALTER TABLE listings ADD COLUMN IF NOT EXISTS residency_status TEXT CHECK (residency_status IN ('current', 'last_stayed', 'visited'));
ALTER TABLE listings ADD COLUMN IF NOT EXISTS last_stayed_month INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS last_stayed_year INTEGER;
ALTER TABLE listings ALTER COLUMN title DROP NOT NULL;

-- University reviews (reviews about living near a university, not tied to a listing)
CREATE TABLE IF NOT EXISTS university_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(university_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_university_reviews_university ON university_reviews(university_id);
CREATE INDEX IF NOT EXISTS idx_university_reviews_user ON university_reviews(user_id);

ALTER TABLE university_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "University reviews are viewable by everyone"
  ON university_reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create university reviews"
  ON university_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own university reviews"
  ON university_reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own university reviews"
  ON university_reviews FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all university reviews"
  ON university_reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
