# OnRez — Fixes: Listing Counts, University Filtering, Delete Listings

## 1. Fix Listing Count on Landing Page

**Problem:** The university cards on the landing page show incorrect listing counts. For example, Wilfrid Laurier shows "1 listing" but has 5 when you click in.

**Root cause:** The listing count query is likely using a geographic radius (e.g., `listings_near_university` with 5km radius) which causes overlap between nearby universities like Waterloo and Laurier. Or the count query doesn't match the query used on the university detail page.

**Fix:** Listing counts on the landing page should be based on the `university_id` foreign key on the listings table — NOT geographic distance. A listing belongs to exactly one university, determined by what the user selected when they posted it.

```ts
// WRONG — counting by distance (causes overlap):
const { data } = await supabase.rpc('listings_near_university', {
  uni_lat: university.latitude,
  uni_lng: university.longitude,
  radius_meters: 5000
});

// CORRECT — counting by university_id:
const { data: universities } = await supabase
  .from('universities')
  .select('*, listings(count)')
  .eq('listings.is_active', true)
  .order('name');
```

Make sure the listing count displayed on each UniversityCard comes from this exact query.

---

## 2. University Detail Page — Filter by university_id, Not Distance

**Problem:** Waterloo and Laurier are only ~1km apart. When using geographic radius filtering, listings posted for Waterloo also appear on the Laurier page and vice versa. This is confusing — if a user specifically chose "Waterloo" when posting their listing, it should only appear under Waterloo.

**Fix:** On the university detail page (`/university/[slug]`), filter listings by `university_id` instead of geographic proximity.

```ts
// WRONG — geographic radius (causes cross-contamination between nearby schools):
const { data: listings } = await supabase.rpc('listings_near_university', {
  uni_lat: university.latitude,
  uni_lng: university.longitude,
  radius_meters: 5000
});

// CORRECT — exact university match:
const { data: listings } = await supabase
  .from('listings')
  .select('*, listing_photos(*)')
  .eq('university_id', university.id)
  .eq('is_active', true)
  .order('avg_rating', { ascending: false });
```

**Apply this everywhere university listings are fetched:**
- University detail page (`/university/[slug]`)
- Landing page university cards (listing counts)
- Any stats calculations (average rent, average rating) on the university page

**Keep geographic queries only for the Map page** — the map should still show all listings in the visible area regardless of university assignment, since that's a spatial search by nature.

---

## 3. Map Page — School Filter Should Also Use university_id

**Problem:** When a user selects a university from the dropdown on the map page, it should show only listings assigned to that university — not all listings within a radius.

**Fix:** When a school filter is active on the map page:
- Fly to the university location (already working)
- Fetch listings by `university_id`, not by map bounds

```ts
async function handleSchoolFilterChange(slug: string | null) {
  if (!slug || slug === 'all') {
    // All Universities — zoom out, fetch by map bounds as normal
    mapRef.current?.flyTo({ center: [-79.5, 43.7], zoom: 6, duration: 1500 });
    setSelectedUniversity(null);
    setFilterByUniversity(false);
    // Re-fetch by bounds on next map move
    return;
  }

  const uni = universities.find(u => u.slug === slug);
  if (uni) {
    mapRef.current?.flyTo({ center: [uni.longitude, uni.latitude], zoom: 14, duration: 1500 });
    setSelectedUniversity(uni);
    setFilterByUniversity(true);

    // Fetch listings for this specific university
    const { data } = await supabase
      .from('listings')
      .select('*, listing_photos(*)')
      .eq('university_id', uni.id)
      .eq('is_active', true);

    setListings(data || []);
  }
}
```

When the user clears the filter (selects "All Universities") or pans the map manually, switch back to the geographic bounds-based query.

---

## 4. Delete Listing — User Can Delete Their Own Posting

**Problem:** There is no way for a user to delete a listing they posted.

**Fix:** Add delete functionality in two places:

### A) My Listings Page (`/my-listings`)

Each listing card on this page should have a "Delete" button (or a dropdown menu with Edit and Delete options).

```tsx
// On each listing card in My Listings:
<div className="flex gap-2">
  <Button variant="outline" size="sm" onClick={() => router.push(`/listing/${listing.id}/edit`)}>
    Edit
  </Button>
  <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(listing.id)}>
    Delete
  </Button>
</div>
```

**Delete handler with confirmation:**
```tsx
async function handleDelete(listingId: string) {
  const confirmed = window.confirm('Are you sure you want to delete this listing? This cannot be undone.');
  if (!confirmed) return;

  const supabase = createClient();
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId);

  if (!error) {
    // Remove from local state or refresh
    router.refresh();
  }
}
```

Or if you prefer soft-delete (set `is_active = false` instead of permanently removing):
```tsx
async function handleDelete(listingId: string) {
  const confirmed = window.confirm('Are you sure you want to remove this listing?');
  if (!confirmed) return;

  const supabase = createClient();
  const { error } = await supabase
    .from('listings')
    .update({ is_active: false })
    .eq('id', listingId);

  if (!error) {
    router.refresh();
  }
}
```

**Recommendation:** Use soft-delete (`is_active = false`). This way the data is preserved in case the user wants to reactivate it later, and reviews are not lost. The listing won't appear anywhere on the site since all queries already filter by `is_active = true`.

### B) Listing Detail Page (`/listing/[id]`)

If the current user is the owner of the listing, show edit and delete buttons on the detail page as well.

```tsx
// In the listing detail page server component, check ownership:
const { data: { user } } = await supabase.auth.getUser();
const isOwner = user?.id === listing.owner_id;

// Pass to client component:
<ListingDetail listing={listing} isOwner={isOwner} ... />
```

**In the ListingDetail component, show owner actions:**
```tsx
{isOwner && (
  <div className="flex gap-3 mt-4">
    <Button variant="outline" onClick={() => router.push(`/listing/${listing.id}/edit`)}>
      Edit Listing
    </Button>
    <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(listing.id)}>
      Delete Listing
    </Button>
  </div>
)}
```

Place these buttons near the top of the listing detail page, below the address and info section — visible but not the primary focus.

### C) If My Listings Page Doesn't Exist Yet — Create It

If `/my-listings` hasn't been built yet, create it:

```tsx
// src/app/my-listings/page.tsx
export default async function MyListingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const { data: listings } = await supabase
    .from('listings')
    .select('*, listing_photos(*), universities(name, slug)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  // Show both active and inactive (so user can see deactivated ones)
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Listings</h1>

      {!listings?.length ? (
        <div className="text-center py-16 text-gray-500">
          <p>You haven't posted any listings yet.</p>
          <Button className="mt-4" onClick={() => router.push('/listing/new')}>
            Post Your First Listing
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {listings.map(listing => (
            // Listing card with Edit + Delete buttons
            // Show a "Deactivated" badge if is_active === false
          ))}
        </div>
      )}
    </div>
  );
}
```

**Add "My Listings" to the navbar dropdown** (for logged-in users):
```
[Avatar] Jane ▾
  ├── My Bookmarks       → /bookmarks
  ├── My Listings         → /my-listings
  ├── Post a Listing      → /listing/new
  ├── ─────────────
  └── Log Out
```

---

## Summary

| # | Fix | Impact |
|---|-----|--------|
| 1 | Landing page listing counts use `university_id` not distance | Correct counts on university cards |
| 2 | University detail page filters by `university_id` | Waterloo listings only on Waterloo page, Laurier only on Laurier |
| 3 | Map school filter uses `university_id` when a school is selected | Consistent filtering on map |
| 4 | Users can delete (soft-delete) their own listings | My Listings page + Listing Detail page |
