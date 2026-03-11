-- Anonymous reviews: each review gets a random avatar icon (no display name).
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS avatar_icon TEXT;
