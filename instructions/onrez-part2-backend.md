# OnRez — Backend & Database (Part 2 of 3)

## Overview

Set up the complete backend for **OnRez** using Supabase. This covers the database schema, authentication, storage, Row Level Security (RLS) policies, API routes, and admin access. After completing this part, all data will live in Supabase and be ready to connect to the frontend in Part 3.

**This document assumes Part 1 (frontend with mock data) is already built.**

---

## What This Part Covers

1. Supabase project setup
2. Database schema (all tables, indexes, triggers)
3. Authentication (email/password + Google OAuth)
4. Image storage (listing photos)
5. Row Level Security policies (who can read/write what)
6. Seed data migration (replace mock data)
7. API routes in Next.js (server-side Supabase calls)
8. Admin access (single admin account via role flag)

---

## Tech Stack (Backend)

| Tool | Purpose |
|------|---------|
| **Supabase** | Hosted PostgreSQL + Auth + Storage + Realtime |
| **PostGIS** | Geospatial queries (distance from university, map bounds) |
| **Supabase Auth** | Email/password + Google OAuth |
| **Supabase Storage** | Listing photo uploads |
| **@supabase/supabase-js** | Client SDK |
| **@supabase/ssr** | Server-side auth helpers for Next.js App Router |

---

## 1. Supabase Project Setup

### Create the project
1. Go to https://supabase.com and create a new project
2. Choose a region close to Ontario (e.g., US East)
3. Save your project URL and keys

### Environment Variables

Add to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

- `ANON_KEY` — used in the browser, respects RLS policies
- `SERVICE_ROLE_KEY` — used server-side only, bypasses RLS (for admin operations and seeding)

### Install dependencies
```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## 2. Supabase Client Setup

Create two client helpers — one for the browser, one for server-side.

### Browser Client (`src/lib/supabase/client.ts`)
```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Client (`src/lib/supabase/server.ts`)
```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

### Admin Client (`src/lib/supabase/admin.ts`)
```ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### Middleware (`src/middleware.ts`)
Refreshes the auth session on every request:
```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.getUser();
  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

---

## 3. Database Schema

Run this SQL in the Supabase SQL Editor (or as a migration file).

```sql
-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- UNIVERSITIES
-- ============================================
CREATE TABLE universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  province TEXT DEFAULT 'ON',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_universities_slug ON universities(slug);

-- ============================================
-- USER PROFILES
-- ============================================
-- Extends Supabase auth.users with app-specific data
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  university_id UUID REFERENCES universities(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- LISTINGS
-- ============================================
CREATE TABLE listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  price_per_month INTEGER NOT NULL,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  property_type TEXT CHECK (property_type IN ('apartment', 'house', 'condo', 'basement', 'room', 'studio')),
  amenities TEXT[] DEFAULT '{}',
  available_from DATE,
  available_to DATE,
  university_id UUID REFERENCES universities(id),
  owner_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT TRUE,
  avg_rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-set the PostGIS location point from lat/lng on insert or update
CREATE OR REPLACE FUNCTION set_listing_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_Point(NEW.longitude, NEW.latitude)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_listing_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON listings
FOR EACH ROW EXECUTE FUNCTION set_listing_location();

CREATE INDEX idx_listings_location ON listings USING GIST(location);
CREATE INDEX idx_listings_university ON listings(university_id);
CREATE INDEX idx_listings_price ON listings(price_per_month);
CREATE INDEX idx_listings_rating ON listings(avg_rating DESC);
CREATE INDEX idx_listings_active ON listings(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_listings_owner ON listings(owner_id);

-- ============================================
-- LISTING PHOTOS
-- ============================================
CREATE TABLE listing_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listing_photos_listing ON listing_photos(listing_id);

-- ============================================
-- REVIEWS
-- ============================================
-- One review per user per listing (enforced by unique constraint)
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, user_id)
);

CREATE INDEX idx_reviews_listing ON reviews(listing_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- Auto-update listing avg_rating and review_count when reviews change
CREATE OR REPLACE FUNCTION update_listing_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_listing_id UUID;
BEGIN
  target_listing_id := COALESCE(NEW.listing_id, OLD.listing_id);
  UPDATE listings SET
    avg_rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE listing_id = target_listing_id), 0),
    review_count = (SELECT COUNT(*) FROM reviews WHERE listing_id = target_listing_id),
    updated_at = NOW()
  WHERE id = target_listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_listing_rating();

-- ============================================
-- BOOKMARKS (saved listings)
-- ============================================
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_listing ON bookmarks(listing_id);

-- ============================================
-- AUTO-SET UNIVERSITY LOCATION (same pattern as listings)
-- ============================================
CREATE OR REPLACE FUNCTION set_university_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location := ST_Point(NEW.longitude, NEW.latitude)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_university_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON universities
FOR EACH ROW EXECUTE FUNCTION set_university_location();
```

---

## 4. Row Level Security (RLS) Policies

```sql
-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- UNIVERSITIES — public read, admin write
-- ============================================
CREATE POLICY "Universities are viewable by everyone"
  ON universities FOR SELECT USING (true);

CREATE POLICY "Admins can manage universities"
  ON universities FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- PROFILES — public read, own write
-- ============================================
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- LISTINGS — public read, owner write, admin full access
-- ============================================
CREATE POLICY "Active listings are viewable by everyone"
  ON listings FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can view their own inactive listings"
  ON listings FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own listings"
  ON listings FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all listings"
  ON listings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- LISTING PHOTOS — public read, listing owner write
-- ============================================
CREATE POLICY "Photos are viewable by everyone"
  ON listing_photos FOR SELECT USING (true);

CREATE POLICY "Listing owners can manage photos"
  ON listing_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_photos.listing_id
      AND listings.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all photos"
  ON listing_photos FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- REVIEWS — public read, one per user per listing, owner can edit
-- ============================================
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
  ON reviews FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- BOOKMARKS — private to each user
-- ============================================
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 5. Authentication

### Supabase Auth Configuration

In the Supabase dashboard:

1. **Email/Password:** Enabled by default. Under Authentication → Providers → Email, ensure "Enable Email" is on.
2. **Google OAuth:** Under Authentication → Providers → Google:
   - Create OAuth credentials at https://console.cloud.google.com/apis/credentials
   - Set the authorized redirect URI to: `https://your-project.supabase.co/auth/v1/callback`
   - Paste the Client ID and Client Secret into Supabase

### Auth Flow in the App

**Sign up (email):**
```ts
const { data, error } = await supabase.auth.signUp({
  email: 'student@example.com',
  password: 'password123',
  options: {
    data: { full_name: 'Jane Student' }  // stored in raw_user_meta_data, used by trigger
  }
});
```

**Log in (email):**
```ts
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'student@example.com',
  password: 'password123'
});
```

**Log in (Google):**
```ts
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
});
```

**Auth callback route (`src/app/auth/callback/route.ts`):**
```ts
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/', request.url));
}
```

**Log out:**
```ts
await supabase.auth.signOut();
```

**Get current user (server-side):**
```ts
const supabase = await createServerSupabaseClient();
const { data: { user } } = await supabase.auth.getUser();
```

---

## 6. Storage (Listing Photos)

### Create Storage Bucket

In Supabase dashboard → Storage → Create bucket:
- Name: `listing-photos`
- Public: **Yes** (images need public URLs)
- File size limit: 5MB
- Allowed MIME types: `image/jpeg, image/png, image/webp`

### Storage Policies

```sql
-- Anyone can view listing photos
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-photos');

-- Authenticated users can upload photos
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listing-photos' AND auth.role() = 'authenticated');

-- Users can delete their own uploads (file path starts with their user ID)
CREATE POLICY "Users can delete own uploads"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
```

### Upload Pattern

Photos should be stored with the path pattern: `{user_id}/{listing_id}/{filename}`

```ts
const filePath = `${userId}/${listingId}/${Date.now()}_${file.name}`;
const { data, error } = await supabase.storage
  .from('listing-photos')
  .upload(filePath, file);

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('listing-photos')
  .getPublicUrl(filePath);
```

---

## 7. API Routes

Create Next.js API routes that handle server-side Supabase operations.

### Listings API (`src/app/api/listings/route.ts`)

**GET** — Fetch listings with filters:
- Query params: `university`, `minPrice`, `maxPrice`, `bedrooms`, `propertyType`, `sort`, `page`, `limit`, `bounds` (map viewport)
- Supports sorting by: `rating` (default), `price_asc`, `price_desc`, `reviews`, `newest`
- Supports geographic bounding box filter for map viewport queries
- Returns listings with their photos (join `listing_photos`)

**POST** — Create a new listing (requires auth):
- Body: listing fields + uploaded photo URLs
- Sets `owner_id` to the current user
- Inserts listing + listing_photos rows

### Single Listing API (`src/app/api/listings/[id]/route.ts`)

**GET** — Fetch one listing with photos and reviews
**PUT** — Update listing (owner only)
**DELETE** — Deactivate listing, set `is_active = false` (owner only)

### Reviews API (`src/app/api/reviews/route.ts`)

**GET** — Fetch reviews for a listing: `?listing_id=xxx`
- Returns reviews joined with `profiles` for display name and avatar

**POST** — Create or update a review (requires auth):
- Body: `{ listing_id, rating, comment }`
- Uses `UPSERT` on the `(listing_id, user_id)` unique constraint
- This handles both creating a new review AND editing an existing one

### Single Review API (`src/app/api/reviews/[id]/route.ts`)

**DELETE** — Delete own review (requires auth)

### Bookmarks API (`src/app/api/bookmarks/route.ts`)

**GET** — Fetch current user's bookmarks (requires auth)
- Returns bookmarks joined with listings for card display

**POST** — Toggle bookmark (requires auth):
- Body: `{ listing_id }`
- If bookmark exists → delete it (unbookmark)
- If bookmark doesn't exist → create it (bookmark)
- Returns `{ bookmarked: true/false }`

### Nearby API (`src/app/api/nearby/route.ts`)

**GET** — Proxy to Overpass API for nearby amenities:
- Query params: `lat`, `lng`, `type` (bus_stop, restaurant, shopping), `radius` (default 1000m)
- Calls Overpass API server-side to avoid CORS
- Cache results with Next.js `unstable_cache` (1 hour TTL)

```ts
// Overpass query patterns:
// Bus stops: node["highway"="bus_stop"](around:${radius},${lat},${lng})
// Restaurants: node["amenity"~"restaurant|fast_food|cafe"](around:${radius},${lat},${lng})
// Shopping: node["shop"~"mall|supermarket|convenience"](around:${radius},${lat},${lng})
```

### Upload API (`src/app/api/upload/route.ts`)

**POST** — Upload listing photos (requires auth):
- Accepts `multipart/form-data` with image files
- Uploads to Supabase Storage under `{user_id}/{listing_id}/`
- Returns array of public URLs

---

## 8. Admin Access

### Setup

Admin is a single account (yours). After creating your account:

1. Sign up normally through the app
2. In the Supabase SQL Editor, promote your account:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### What Admin Can Do

With the RLS policies above, the admin account can:
- View all listings (including inactive ones)
- Edit or delete any listing
- Delete any review (e.g., spam or inappropriate)
- Manage universities (add, edit, remove)
- Manage all listing photos

### Admin Check Helper

```ts
// src/lib/auth.ts
export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}
```

For the MVP, admin actions happen through the Supabase dashboard table editor. A built-in admin panel can be added later.

---

## 9. Seed Data

Create a seed script (`scripts/seed.ts`) that populates the database with initial data using the service role key. This replaces the mock data from Part 1.

```bash
npx tsx scripts/seed.ts
```

The seed script should:

1. **Insert universities** — the 10 Ontario universities with real coordinates, placeholder images
2. **Insert sample listings** — 30-40 listings spread across campuses with realistic addresses, prices, descriptions, placeholder photo URLs
3. **Insert listing photos** — 3-5 placeholder photos per listing
4. **Insert sample reviews** — 50-80 reviews with varied ratings and realistic student comments
5. **Create sample profiles** — fake user profiles for the review authors

Use the `supabaseAdmin` client (service role) to bypass RLS during seeding.

### Seed Data Structure

```ts
// scripts/seed.ts
import { supabaseAdmin } from '../src/lib/supabase/admin';

async function seed() {
  // 1. Clear existing data (in order due to foreign keys)
  await supabaseAdmin.from('bookmarks').delete().neq('id', '');
  await supabaseAdmin.from('reviews').delete().neq('id', '');
  await supabaseAdmin.from('listing_photos').delete().neq('id', '');
  await supabaseAdmin.from('listings').delete().neq('id', '');
  await supabaseAdmin.from('universities').delete().neq('id', '');

  // 2. Insert universities
  const { data: universities } = await supabaseAdmin.from('universities').insert([
    { name: 'University of Waterloo', slug: 'waterloo', city: 'Waterloo', latitude: 43.4723, longitude: -80.5449, description: 'Known for engineering, CS, and co-op programs' },
    { name: 'University of Toronto', slug: 'uoft', city: 'Toronto', latitude: 43.6629, longitude: -79.3957, description: 'Canada\'s top-ranked research university' },
    // ... all 10 universities
  ]).select();

  // 3. Insert listings (reference university IDs from step 2)
  // 4. Insert listing photos
  // 5. Insert sample reviews with fake user IDs
}

seed().then(() => console.log('Seeded!')).catch(console.error);
```

---

## 10. Key Database Queries

These are the main queries the app will use. Implement them in the API routes or as reusable functions in `src/lib/queries.ts`.

### Fetch listings with filters
```ts
let query = supabase
  .from('listings')
  .select('*, listing_photos(*), universities(name, slug)')
  .eq('is_active', true);

if (universitySlug) {
  query = query.eq('universities.slug', universitySlug);
}
if (minPrice) query = query.gte('price_per_month', minPrice);
if (maxPrice) query = query.lte('price_per_month', maxPrice);
if (bedrooms) query = query.eq('bedrooms', bedrooms);
if (propertyType) query = query.eq('property_type', propertyType);

// Sort
if (sort === 'rating') query = query.order('avg_rating', { ascending: false });
if (sort === 'price_asc') query = query.order('price_per_month', { ascending: true });
if (sort === 'price_desc') query = query.order('price_per_month', { ascending: false });
if (sort === 'reviews') query = query.order('review_count', { ascending: false });
if (sort === 'newest') query = query.order('created_at', { ascending: false });

// Pagination
query = query.range(page * limit, (page + 1) * limit - 1);
```

### Fetch listings within map bounds
```ts
// Use PostGIS to filter by bounding box
const { data } = await supabase.rpc('listings_in_bounds', {
  min_lat: bounds.south,
  max_lat: bounds.north,
  min_lng: bounds.west,
  max_lng: bounds.east
});
```

Create this RPC function:
```sql
CREATE OR REPLACE FUNCTION listings_in_bounds(
  min_lat DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  min_lng DOUBLE PRECISION,
  max_lng DOUBLE PRECISION
)
RETURNS SETOF listings AS $$
  SELECT * FROM listings
  WHERE is_active = true
    AND latitude BETWEEN min_lat AND max_lat
    AND longitude BETWEEN min_lng AND max_lng;
$$ LANGUAGE sql STABLE;
```

### Fetch listings near a university
```ts
// Using PostGIS distance function
const { data } = await supabase.rpc('listings_near_university', {
  uni_lat: university.latitude,
  uni_lng: university.longitude,
  radius_meters: 5000
});
```

```sql
CREATE OR REPLACE FUNCTION listings_near_university(
  uni_lat DOUBLE PRECISION,
  uni_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000
)
RETURNS SETOF listings AS $$
  SELECT * FROM listings
  WHERE is_active = true
    AND ST_DWithin(
      location,
      ST_Point(uni_lng, uni_lat)::geography,
      radius_meters
    )
  ORDER BY avg_rating DESC;
$$ LANGUAGE sql STABLE;
```

### Upsert a review (create or edit)
```ts
const { data, error } = await supabase
  .from('reviews')
  .upsert(
    { listing_id: listingId, user_id: userId, rating, comment, updated_at: new Date().toISOString() },
    { onConflict: 'listing_id,user_id' }
  )
  .select();
```

### Toggle bookmark
```ts
const { data: existing } = await supabase
  .from('bookmarks')
  .select('id')
  .eq('user_id', userId)
  .eq('listing_id', listingId)
  .single();

if (existing) {
  await supabase.from('bookmarks').delete().eq('id', existing.id);
  return { bookmarked: false };
} else {
  await supabase.from('bookmarks').insert({ user_id: userId, listing_id: listingId });
  return { bookmarked: true };
}
```

---

## 11. Build Order

1. **Supabase project:** Create project, save credentials to `.env.local`
2. **Install deps:** `@supabase/supabase-js`, `@supabase/ssr`
3. **Client helpers:** Create `client.ts`, `server.ts`, `admin.ts`, `middleware.ts`
4. **Run schema SQL:** Execute the full schema in Supabase SQL Editor (tables, indexes, triggers, functions)
5. **Run RLS SQL:** Execute all RLS policies
6. **Configure auth:** Enable Google OAuth in Supabase dashboard, create the auth callback route
7. **Create storage bucket:** `listing-photos` with public read
8. **Create RPC functions:** `listings_in_bounds`, `listings_near_university`
9. **Seed data:** Write and run the seed script
10. **API routes:** Build all the API routes (listings, reviews, bookmarks, nearby, upload)
11. **Test:** Verify auth flow, CRUD operations, RLS policies, and seed data

---

## Important Notes

- The `UNIQUE(listing_id, user_id)` constraint on reviews enforces one review per user per listing. The upsert pattern lets users edit their existing review seamlessly.
- The `update_listing_rating` trigger automatically recalculates `avg_rating` and `review_count` on the listing whenever a review is created, updated, or deleted. No manual recalculation needed.
- The `handle_new_user` trigger auto-creates a profile row when someone signs up (works for both email and Google OAuth). It pulls the name and avatar from Google's metadata if available.
- RLS ensures users can only modify their own data. The admin role bypasses this for moderation.
- The Overpass API proxy caches results to avoid rate limiting. Bus stops, restaurants, and shops don't change often.
- Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. It's only used in server-side code and the seed script.
