# OnRez — Connect Frontend to Backend (Part 3 of 3)

## Overview

Wire up the Part 1 frontend (mock data, UI-only forms) to the Part 2 backend (Supabase database, auth, storage). After this part, OnRez is a fully working application with real data, authentication, reviews, bookmarks, user-submitted listings, and live map queries.

**This document assumes Part 1 (frontend) and Part 2 (backend setup, schema, auth, API routes) are both complete.**

---

## What This Part Covers

1. Replace all mock data imports with Supabase queries
2. Wire up auth (login, signup, Google, session state in navbar)
3. Wire up reviews (create, edit, display real ratings)
4. Wire up bookmarks (save/unsave listings)
5. Wire up listing submission (users can post their own listings with photo uploads)
6. Wire up map to fetch real listings by viewport bounds
7. Wire up nearby amenities (Overpass API through the proxy route)
8. Wire up explore page sorting by real user ratings
9. Admin delete capabilities

---

## 1. Replace Mock Data Imports

Every page and component currently imports from `src/data/*.ts`. Replace each import with a Supabase query. The TypeScript interfaces stay the same — just the data source changes.

### Pattern: Server Components Fetch Data Directly

Pages in the App Router are server components by default. Fetch data in the page, pass to client components as props.

```tsx
// BEFORE (mock data):
import { listings } from '@/data/listings';

// AFTER (Supabase):
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function Page() {
  const supabase = await createServerSupabaseClient();
  const { data: listings } = await supabase
    .from('listings')
    .select('*, listing_photos(*), universities(name, slug)')
    .eq('is_active', true)
    .order('avg_rating', { ascending: false });

  return <ListingGrid listings={listings} />;
}
```

### Page-by-Page Replacement Guide

#### Home Page (`/`)

**University cards:**
```ts
// Replace: import { universities } from '@/data/universities'
const { data: universities } = await supabase
  .from('universities')
  .select('*, listings(count)')
  .order('name');

// Map the count: university.listings[0].count → listingCount
```

**Top rated listings (horizontal scroll row):**
```ts
// Replace: import { listings } from '@/data/listings'
const { data: topListings } = await supabase
  .from('listings')
  .select('*, listing_photos(*)')
  .eq('is_active', true)
  .order('avg_rating', { ascending: false })
  .limit(10);
```

**Search bar submit:** Already navigates to `/map?university=slug` or `/explore?q=keyword` — no change needed.

#### Map Page (`/map`)

The map page needs **client-side** data fetching because listings update as the user pans/zooms.

```tsx
// src/app/map/page.tsx
// This page is mostly a client component wrapper
'use client';

import dynamic from 'next/dynamic';
const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false });

export default function MapPage() {
  return <MapView />;
}
```

**Inside MapView.tsx — fetch listings by map bounds:**
```ts
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Called on map move (debounced 300ms)
async function fetchListingsInBounds(bounds: { north: number; south: number; east: number; west: number }) {
  const { data } = await supabase.rpc('listings_in_bounds', {
    min_lat: bounds.south,
    max_lat: bounds.north,
    min_lng: bounds.west,
    max_lng: bounds.east
  });
  setListings(data || []);
}

// Also fetch photos for popup previews
async function fetchListingWithPhotos(listingId: string) {
  const { data } = await supabase
    .from('listings')
    .select('*, listing_photos(*)')
    .eq('id', listingId)
    .single();
  return data;
}
```

**School filter dropdown:** When a university is selected, fly to its coordinates AND filter listings:
```ts
async function handleSchoolFilter(universitySlug: string | null) {
  if (!universitySlug) {
    // "All Universities" — zoom out, fetch all
    mapRef.current?.flyTo({ center: [-79.5, 43.7], zoom: 6 });
    return;
  }

  const { data: uni } = await supabase
    .from('universities')
    .select('*')
    .eq('slug', universitySlug)
    .single();

  if (uni) {
    mapRef.current?.flyTo({ center: [uni.longitude, uni.latitude], zoom: 14 });
  }
}
```

**Nearby amenities (toggle layers):** Call the API proxy route:
```ts
async function fetchNearby(lat: number, lng: number, type: string) {
  const res = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&type=${type}&radius=1500`);
  const data = await res.json();
  return data.places; // array of { name, lat, lng, type }
}
```

Fetch amenities when:
- A toggle is turned ON
- The map center changes significantly (debounce, only when zoomed to campus level)

Cache results per area to avoid redundant API calls.

**Bottom listing carousel:** Show listings from current viewport. Reuse the same `listings` state that populates the markers.

#### Explore Page (`/explore`)

This page needs both server-side initial load AND client-side filter updates.

**Initial load (server component):**
```tsx
// src/app/explore/page.tsx
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ [key: string]: string }> }) {
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('listings')
    .select('*, listing_photos(*), universities(name, slug)')
    .eq('is_active', true);

  // Apply URL search params as initial filters
  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,address.ilike.%${params.q}%,description.ilike.%${params.q}%`);
  }
  if (params.university) {
    query = query.eq('universities.slug', params.university);
  }

  // Default sort: top rated
  query = query.order('avg_rating', { ascending: false }).limit(24);

  const { data: listings } = await query;

  return <ExploreClient initialListings={listings || []} />;
}
```

**Client-side filter updates (ExploreClient component):**
```tsx
'use client';

// When user changes filters, fetch new results client-side
async function applyFilters(filters: FilterState) {
  const supabase = createClient();

  let query = supabase
    .from('listings')
    .select('*, listing_photos(*), universities(name, slug)')
    .eq('is_active', true);

  if (filters.minPrice) query = query.gte('price_per_month', filters.minPrice);
  if (filters.maxPrice) query = query.lte('price_per_month', filters.maxPrice);
  if (filters.bedrooms && filters.bedrooms !== 'any') query = query.eq('bedrooms', filters.bedrooms);
  if (filters.propertyType && filters.propertyType !== 'all') query = query.eq('property_type', filters.propertyType);
  if (filters.university) query = query.eq('university_id', filters.university);

  // Sort
  switch (filters.sort) {
    case 'rating': query = query.order('avg_rating', { ascending: false }); break;
    case 'price_asc': query = query.order('price_per_month', { ascending: true }); break;
    case 'price_desc': query = query.order('price_per_month', { ascending: false }); break;
    case 'reviews': query = query.order('review_count', { ascending: false }); break;
    case 'newest': query = query.order('created_at', { ascending: false }); break;
  }

  // Pagination
  query = query.range(filters.page * 24, (filters.page + 1) * 24 - 1);

  const { data, error } = await query;
  setListings(data || []);
}
```

#### University Detail Page (`/university/[slug]`)

**Server component fetch:**
```tsx
export default async function UniversityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch university
  const { data: university } = await supabase
    .from('universities')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!university) notFound();

  // Fetch nearby listings
  const { data: listings } = await supabase
    .rpc('listings_near_university', {
      uni_lat: university.latitude,
      uni_lng: university.longitude,
      radius_meters: 5000
    });

  // Fetch photos for those listings
  const listingIds = listings?.map(l => l.id) || [];
  const { data: photos } = await supabase
    .from('listing_photos')
    .select('*')
    .in('listing_id', listingIds);

  // Compute stats
  const avgRent = listings?.length
    ? Math.round(listings.reduce((sum, l) => sum + l.price_per_month, 0) / listings.length)
    : 0;
  const avgRating = listings?.length
    ? (listings.reduce((sum, l) => sum + Number(l.avg_rating), 0) / listings.length).toFixed(1)
    : '0';

  return (
    <UniversityDetail
      university={university}
      listings={listings || []}
      photos={photos || []}
      stats={{ avgRent, listingCount: listings?.length || 0, avgRating }}
    />
  );
}
```

#### Listing Detail Page (`/listing/[id]`)

```tsx
export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // Fetch listing with photos and university
  const { data: listing } = await supabase
    .from('listings')
    .select('*, listing_photos(*), universities(name, slug)')
    .eq('id', id)
    .single();

  if (!listing) notFound();

  // Fetch reviews with user profiles
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, profiles(display_name, avatar_url)')
    .eq('listing_id', id)
    .order('created_at', { ascending: false });

  // Check if current user has bookmarked this listing
  const { data: { user } } = await supabase.auth.getUser();
  let isBookmarked = false;
  let userReview = null;

  if (user) {
    const { data: bookmark } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('listing_id', id)
      .single();
    isBookmarked = !!bookmark;

    // Check if user already left a review (for edit mode)
    userReview = reviews?.find(r => r.user_id === user.id) || null;
  }

  return (
    <ListingDetail
      listing={listing}
      reviews={reviews || []}
      isBookmarked={isBookmarked}
      userReview={userReview}
      isLoggedIn={!!user}
    />
  );
}
```

---

## 2. Wire Up Authentication

### Navbar Auth State

The Navbar needs to show "Log in / Sign up" for guests and the user's name/avatar + "Log out" for authenticated users.

```tsx
// src/components/layout/Navbar.tsx — make this a server component wrapper + client inner
// Server part fetches user, client part handles interactions

// In the server layout:
const supabase = await createServerSupabaseClient();
const { data: { user } } = await supabase.auth.getUser();
let profile = null;
if (user) {
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  profile = data;
}

// Pass to Navbar:
<Navbar user={user} profile={profile} />
```

**Navbar client component shows:**
- Logged out: "Log in" text link + "Sign up" blue button
- Logged in: user avatar (or initials circle) + display name + dropdown menu with "My Bookmarks", "My Listings", "Log out"

### Login Page (`/auth/login`)

Replace the UI-only form with real auth:

```tsx
'use client';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();

  async function handleEmailLogin(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  }

  return (
    // Existing form UI + Google button
    // Add a "Continue with Google" button above the email form
    // Show error messages below inputs
  );
}
```

### Signup Page (`/auth/signup`)

```tsx
async function handleSignup(name: string, email: string, password: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  });
  if (error) {
    setError(error.message);
  } else {
    // Show "Check your email for confirmation" message
    setSuccess(true);
  }
}
```

### Auth Callback Route

Already defined in Part 2 at `src/app/auth/callback/route.ts`. Make sure it exists.

### Logout

```tsx
async function handleLogout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  router.push('/');
  router.refresh();
}
```

### Protected Actions

For actions that require login (review, bookmark, submit listing), check auth state first:

```tsx
function handleProtectedAction() {
  if (!user) {
    router.push('/auth/login');
    return;
  }
  // proceed with action
}
```

---

## 3. Wire Up Reviews

### Display Reviews

Already fetched in the listing detail page server component. Pass to a `ReviewSection` client component:

```tsx
<ReviewSection
  reviews={reviews}
  listingId={listing.id}
  userReview={userReview}
  isLoggedIn={isLoggedIn}
/>
```

### Submit / Edit Review

The `ReviewForm` component now actually submits:

```tsx
'use client';

function ReviewForm({ listingId, existingReview, onReviewSubmitted }: Props) {
  const supabase = createClient();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('reviews')
      .upsert(
        {
          listing_id: listingId,
          user_id: user.id,
          rating,
          comment,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'listing_id,user_id' }
      );

    if (!error) {
      onReviewSubmitted(); // trigger re-fetch or router.refresh()
    }
    setLoading(false);
  }

  return (
    // Existing star selector + textarea UI
    // If existingReview exists, show "Edit your review" heading instead of "Write a review"
    // Pre-fill with existing rating and comment
    // Submit button text: existingReview ? "Update Review" : "Submit Review"
  );
}
```

### Delete Own Review

Add a small "Delete" button on the user's own review:

```tsx
async function handleDeleteReview(reviewId: string) {
  const supabase = createClient();
  await supabase.from('reviews').delete().eq('id', reviewId);
  router.refresh();
}
```

---

## 4. Wire Up Bookmarks

### Bookmark Button on ListingCard and ListingDetail

Add a heart/bookmark icon button to listings:

```tsx
'use client';

function BookmarkButton({ listingId, initialBookmarked, isLoggedIn }: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function toggleBookmark() {
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId })
    });
    const data = await res.json();
    setBookmarked(data.bookmarked);
    setLoading(false);
  }

  return (
    <button onClick={toggleBookmark} disabled={loading}>
      <Heart className={bookmarked ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
    </button>
  );
}
```

### Bookmarks on ListingCard

For the listing grid and explore page, fetch bookmark status for the current user:

```tsx
// In server component, if user is logged in:
const { data: bookmarks } = await supabase
  .from('bookmarks')
  .select('listing_id')
  .eq('user_id', user.id);

const bookmarkedIds = new Set(bookmarks?.map(b => b.listing_id));

// Pass to grid:
<ListingGrid listings={listings} bookmarkedIds={bookmarkedIds} isLoggedIn={!!user} />
```

### My Bookmarks Page (optional but recommended)

Add a simple page at `/bookmarks` accessible from the user dropdown in the navbar:

```tsx
// src/app/bookmarks/page.tsx
export default async function BookmarksPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*, listings(*, listing_photos(*), universities(name, slug))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const listings = bookmarks?.map(b => b.listings) || [];

  return (
    <div>
      <h1>Saved Listings</h1>
      <ListingGrid listings={listings} bookmarkedIds={new Set(listings.map(l => l.id))} isLoggedIn={true} />
    </div>
  );
}
```

---

## 5. Wire Up Listing Submission

### Create Listing Page (`/listing/new`)

Add a new page for submitting listings. Link to it from the navbar dropdown ("Post a Listing").

```tsx
// src/app/listing/new/page.tsx
export default async function NewListingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: universities } = await supabase
    .from('universities')
    .select('id, name, slug')
    .order('name');

  return <ListingForm universities={universities || []} />;
}
```

### Listing Form Component

```tsx
'use client';

function ListingForm({ universities }: { universities: University[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);

  async function handleSubmit(formData: FormState) {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Create the listing
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        title: formData.title,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        latitude: formData.latitude,
        longitude: formData.longitude,
        price_per_month: formData.pricePerMonth,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        property_type: formData.propertyType,
        amenities: formData.amenities,
        available_from: formData.availableFrom,
        university_id: formData.universityId,
        owner_id: user.id,
      })
      .select()
      .single();

    if (error || !listing) {
      setError('Failed to create listing');
      setLoading(false);
      return;
    }

    // 2. Upload photos
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const filePath = `${user.id}/${listing.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('listing-photos')
        .upload(filePath, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('listing-photos')
          .getPublicUrl(filePath);

        // 3. Save photo record
        await supabase.from('listing_photos').insert({
          listing_id: listing.id,
          url: publicUrl,
          display_order: i,
        });
      }
    }

    router.push(`/listing/${listing.id}`);
    setLoading(false);
  }

  return (
    // Form with fields:
    // - Title (text input)
    // - Description (textarea)
    // - Address (text input)
    // - City (text input)
    // - Latitude / Longitude (number inputs — or use a map pin picker for better UX)
    // - Price per month (number input)
    // - Bedrooms (number select)
    // - Bathrooms (number select)
    // - Property type (dropdown)
    // - Amenities (checkboxes: wifi, laundry, parking, gym, ac, furnished, pets allowed, utilities included)
    // - Available from (date picker)
    // - University (dropdown from universities prop)
    // - Photos (file upload, allow multiple, show previews)
    // - Submit button
  );
}
```

### My Listings Page (`/my-listings`)

Add a page for users to see and manage their own listings:

```tsx
export default async function MyListingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: listings } = await supabase
    .from('listings')
    .select('*, listing_photos(*)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  return (
    // Grid of user's listings with edit/delete buttons
    // Show both active and inactive listings
    // "Post a new listing" CTA if empty
  );
}
```

### Edit Listing

Reuse the same `ListingForm` component pre-filled with existing data. Add an edit route at `/listing/[id]/edit`:

```tsx
export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: listing } = await supabase
    .from('listings')
    .select('*, listing_photos(*)')
    .eq('id', id)
    .eq('owner_id', user.id)  // Only owner can edit
    .single();

  if (!listing) notFound();

  const { data: universities } = await supabase.from('universities').select('id, name, slug').order('name');

  return <ListingForm universities={universities || []} existingListing={listing} />;
}
```

---

## 6. Wire Up Map Page

### Replace Mock Markers with Live Data

The `MapView` component should:

1. On initial load, fetch all listings (or listings in the initial viewport)
2. On map move/zoom, debounce and re-fetch listings in the new bounds
3. On school filter change, fly to university and re-fetch

```tsx
'use client';

function MapView() {
  const supabase = createClient();
  const [listings, setListings] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState({ bus: [], food: [], shops: [] });
  const mapRef = useRef(null);

  // Fetch universities once on mount
  useEffect(() => {
    supabase.from('universities').select('*').then(({ data }) => setUniversities(data || []));
  }, []);

  // Fetch listings when bounds change
  const fetchListings = useDebouncedCallback(async () => {
    const bounds = mapRef.current?.getBounds();
    if (!bounds) return;

    const { data } = await supabase.rpc('listings_in_bounds', {
      min_lat: bounds.getSouth(),
      max_lat: bounds.getNorth(),
      min_lng: bounds.getWest(),
      max_lng: bounds.getEast()
    });

    // Also fetch photos for popup previews
    if (data?.length) {
      const ids = data.map(l => l.id);
      const { data: photos } = await supabase
        .from('listing_photos')
        .select('*')
        .in('listing_id', ids)
        .order('display_order');

      // Attach first photo to each listing
      const photosMap = {};
      photos?.forEach(p => {
        if (!photosMap[p.listing_id]) photosMap[p.listing_id] = p.url;
      });
      data.forEach(l => l.thumbnailUrl = photosMap[l.id] || null);
    }

    setListings(data || []);
  }, 300);

  // Fetch nearby amenities when toggled on
  async function fetchNearby(type: string) {
    const center = mapRef.current?.getCenter();
    if (!center) return;

    const res = await fetch(`/api/nearby?lat=${center.lat}&lng=${center.lng}&type=${type}&radius=1500`);
    const data = await res.json();
    setNearbyPlaces(prev => ({ ...prev, [type]: data.places || [] }));
  }

  return (
    <Map
      ref={mapRef}
      onMoveEnd={fetchListings}
      // ... mapbox props
    >
      {/* Listing markers */}
      {listings.map(listing => (
        <ListingMarker key={listing.id} listing={listing} />
      ))}

      {/* University markers */}
      {universities.map(uni => (
        <UniversityMarker key={uni.id} university={uni} />
      ))}

      {/* Amenity layers (conditionally rendered based on toggle state) */}
      {showTransit && nearbyPlaces.bus.map(/* bus stop markers */)}
      {showFood && nearbyPlaces.food.map(/* restaurant markers */)}
      {showShops && nearbyPlaces.shops.map(/* shopping markers */)}
    </Map>
  );
}
```

---

## 7. Wire Up Nearby Amenities (All Map Instances)

Every map in the app (Map page, university detail, listing detail) uses the same toggle system. Create a reusable hook:

```tsx
// src/hooks/useNearby.ts
'use client';

export function useNearby() {
  const [layers, setLayers] = useState({ bus: false, food: false, shops: false });
  const [places, setPlaces] = useState({ bus: [], food: [], shops: [] });
  const cache = useRef(new Map());

  async function toggleLayer(type: 'bus' | 'food' | 'shops', lat: number, lng: number) {
    const newState = !layers[type];
    setLayers(prev => ({ ...prev, [type]: newState }));

    if (newState) {
      const cacheKey = `${type}:${lat.toFixed(3)}:${lng.toFixed(3)}`;
      if (cache.current.has(cacheKey)) {
        setPlaces(prev => ({ ...prev, [type]: cache.current.get(cacheKey) }));
        return;
      }

      const apiType = type === 'bus' ? 'bus_stop' : type === 'food' ? 'restaurant' : 'shopping';
      const res = await fetch(`/api/nearby?lat=${lat}&lng=${lng}&type=${apiType}&radius=1500`);
      const data = await res.json();
      cache.current.set(cacheKey, data.places || []);
      setPlaces(prev => ({ ...prev, [type]: data.places || [] }));
    }
  }

  return { layers, places, toggleLayer };
}
```

---

## 8. Admin Capabilities

### Admin Delete Buttons

On the listing detail page, if the current user is an admin, show additional controls:

```tsx
// In ListingDetail server component:
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user?.id)
  .single();

const isAdmin = profile?.role === 'admin';

// Pass to component:
<ListingDetail ... isAdmin={isAdmin} />
```

Admin sees:
- "Delete Listing" button on any listing
- "Delete Review" button on any review
- These call the API routes which check admin role server-side

```tsx
// Admin delete listing
async function adminDeleteListing(listingId: string) {
  await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
  router.push('/explore');
}

// Admin delete review
async function adminDeleteReview(reviewId: string) {
  await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
  router.refresh();
}
```

In the API routes, check for admin role before allowing deletes on other users' content:

```ts
// In API route handler:
const supabase = await createServerSupabaseClient();
const { data: { user } } = await supabase.auth.getUser();

const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (profile?.role !== 'admin' && listing.owner_id !== user.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

---

## 9. Updated Navbar Links

The navbar dropdown for logged-in users should include:

```
[Avatar] Jane ▾
  ├── My Bookmarks       → /bookmarks
  ├── My Listings         → /my-listings
  ├── Post a Listing      → /listing/new
  ├── ─────────────
  └── Log Out
```

---

## 10. Loading & Error States

Replace any hardcoded empty states with real feedback:

**Loading:** Use Next.js `loading.tsx` files for route-level loading:
```tsx
// src/app/explore/loading.tsx
export default function Loading() {
  return <ListingGridSkeleton count={12} />;
}
```

**Empty states:**
- Explore with no results: "No listings match your filters. Try broadening your search."
- University with no listings: "No listings near [University] yet. Be the first to post!"
- No reviews: "No reviews yet. Be the first to share your experience."
- No bookmarks: "You haven't saved any listings yet. Browse listings to save your favorites."

**Error handling:**
```tsx
// Wrap Supabase calls in try/catch
try {
  const { data, error } = await supabase.from('listings').select('*');
  if (error) throw error;
} catch (err) {
  console.error(err);
  // Show user-friendly error message
}
```

---

## 11. Files to Delete After Migration

Once everything is wired up, delete the mock data files:

```
src/data/universities.ts    ← DELETE
src/data/listings.ts        ← DELETE
src/data/reviews.ts         ← DELETE
src/data/nearby.ts          ← DELETE
```

All data now comes from Supabase.

---

## Build Order

1. **Supabase clients:** Verify `client.ts`, `server.ts`, `admin.ts`, `middleware.ts` are set up from Part 2
2. **Auth pages:** Wire login (email + Google), signup, callback, and logout
3. **Navbar auth state:** Show user info when logged in, guest links when not
4. **Home page:** Replace mock university + listing imports with Supabase queries
5. **Explore page:** Replace mock data, wire up filters + sort with real Supabase queries
6. **Map page:** Replace mock markers with live `listings_in_bounds` RPC, wire school filter, wire nearby API
7. **University detail:** Replace mock data with `listings_near_university` RPC
8. **Listing detail:** Replace mock data, wire real reviews display
9. **Reviews:** Wire ReviewForm to upsert, add edit/delete capability
10. **Bookmarks:** Add BookmarkButton to cards and detail page, create bookmarks page
11. **Listing submission:** Build create listing page + form + photo upload
12. **My listings:** Build management page with edit/delete
13. **Admin controls:** Add admin delete buttons on listings and reviews
14. **Loading/error states:** Add loading.tsx skeletons, empty states, error handling
15. **Delete mock data files**

---

## Important Notes

- Server components fetch data with `createServerSupabaseClient()`. Client components use `createClient()`.
- The `middleware.ts` refreshes auth sessions on every request — this is critical for server components to see the logged-in user.
- The upsert pattern for reviews (`onConflict: 'listing_id,user_id'`) means the same form handles both create and edit. If the user already has a review, pre-fill the form and the upsert updates it.
- Bookmarks are private (RLS policy) — users only see their own.
- Admin checks happen server-side in API routes. Never trust client-side admin flags for write operations.
- Use `router.refresh()` after mutations to re-fetch server component data without a full page reload.
- The Overpass API proxy caches results. Don't fetch amenities on every map pan — only when toggles are active and the center has moved significantly.
