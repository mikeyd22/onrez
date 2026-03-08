# OnRez — Student Housing

Student housing platform for Ontario universities.

## Setup

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local` (see `.env.local.example`):

- **Supabase** (for backend): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — use placeholders until you create a project at [supabase.com](https://supabase.com).
- **Mapbox**: `NEXT_PUBLIC_MAPBOX_TOKEN` — get from [account.mapbox.com](https://account.mapbox.com/access-tokens/). Without it, map pages show a placeholder.

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

- **/** — Home: hero search, university cards, top-rated listings
- **/map** — Full-screen Ontario map, school filter, listing markers, transit/food/shops toggles
- **/explore** — Filterable listing grid (price, bedrooms, type, sort)
- **/university/[slug]** — University hero, stats, map, listings
- **/listing/[id]** — Listing gallery, details, amenities, map, reviews
- **/auth/login**, **/auth/signup** — Login/signup forms (UI only)

## Backend (Part 2)

- **Supabase**: Auth (email + Google OAuth), Postgres, Storage, RLS
- **API routes**: `/api/listings`, `/api/listings/[id]`, `/api/reviews`, `/api/reviews/[id]`, `/api/bookmarks`, `/api/universities`, `/api/nearby`, `/api/upload`
- **Auth callback**: `/auth/callback` (for OAuth redirect)
- **Seed**: `npm run seed` (requires Supabase keys and running migrations first)

**Manual steps (placeholders until you do them):**

1. Create a Supabase project and add URL + anon + service_role keys to `.env.local`.
2. In Supabase SQL Editor, run the migrations in `supabase/migrations/` in order (001_schema, 002_rls, 003_rpc, 004_storage_policies). Create the `listing-photos` storage bucket first if needed.
3. In Dashboard → Auth → Providers, enable Google and add your OAuth client ID/secret; set redirect URI to `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`.
4. After first sign-up, promote your account: `UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';`
5. Optional: set `SEED_OWNER_EMAIL` in `.env.local` to an existing user email so seeded listings have an owner; then run `npm run seed`.

## Tech

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase (Postgres, Auth, Storage), @supabase/ssr
- react-map-gl + Mapbox GL JS, Lucide React, Radix primitives, DM Sans

Frontend still uses mock data in `src/data/` until Part 3 connects it to the API.
