# Supabase setup

1. Create a project at https://supabase.com and note:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

2. In Supabase SQL Editor, run the migrations in order:
   - `migrations/001_schema.sql` — tables, indexes, triggers
   - `migrations/002_rls.sql` — Row Level Security policies
   - `migrations/003_rpc.sql` — RPC functions for map

3. **Storage:** In Dashboard → Storage → New bucket:
   - Name: `listing-photos`
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME: `image/jpeg`, `image/png`, `image/webp`

4. In SQL Editor, run **Storage policies** (see Part 2 doc or `migrations/004_storage_policies.sql` if added).

5. **Auth:** In Dashboard → Authentication → Providers:
   - Email: enable if needed
   - Google: add Client ID + Secret (from Google Cloud Console), redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

6. Copy `.env.local.example` to `.env.local` and fill in your keys.

7. Promote yourself to admin after first sign-up:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
