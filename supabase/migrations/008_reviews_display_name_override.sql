-- Per-review display name override: show this name instead of profile when set.
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS display_name_override TEXT;
