-- Add FK from reviews.user_id to profiles(id) so PostgREST/Supabase can
-- resolve the relationship for .select("*, profiles(...)") joins.
-- profiles.id = auth.users.id (1:1), so this is safe when profiles exist.
ALTER TABLE reviews
  ADD CONSTRAINT reviews_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
