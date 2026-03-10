# OnRez — Feature Update: Reviews, Listing Form, Address Autocomplete

## Overview

This update modifies the existing OnRez app with the following changes:

1. Add "Add your review" button on both university pages and listing detail pages
2. Redesign the listing submission form (remove title, add new fields, address autocomplete)
3. Remove latitude/longitude from user-facing forms (auto-resolve from address)
4. Add Google Places Autocomplete for address input
5. Add "last stayed" / residency status field
6. Add "basement" as an amenity option
7. Use address as the listing display name everywhere (no more title)

---

## 1. Remove "Title" from Listings

**The address IS the listing name.** Remove the `title` field entirely from:

- The listing submission form (`/listing/new`)
- The listing edit form (`/listing/[id]/edit`)
- The `ListingCard` component — display the address as the main heading instead of title
- The `ListingDetail` component — display the address as the page heading
- The database: make `title` nullable or remove the NOT NULL constraint, and stop requiring it

**Everywhere the app currently shows a listing title, show the address instead.**

```sql
-- Migration: make title optional (it's no longer used but keep column for backward compatibility)
ALTER TABLE listings ALTER COLUMN title DROP NOT NULL;
```

**ListingCard display change:**
```
BEFORE:                          AFTER:
┌──────────────┐                ┌──────────────┐
│ [Photo]      │                │ [Photo]      │
│ Bright 2BR   │  ← title      │ 123 King St  │  ← address
│ Waterloo     │  ← city       │ Waterloo     │  ← city
│ $1,200/mo    │                │ $1,200/mo    │
│ ★ 4.5 (12)   │                │ ★ 4.5 (12)   │
└──────────────┘                └──────────────┘
```

---

## 2. Redesign Listing Submission Form

### Updated Form Fields (in order)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| **Address** | Google Places Autocomplete text input | Yes | Auto-fills city and resolves lat/lng in the background |
| **City** | Text input (auto-filled from address) | Yes | Pre-populated by Google Places, user can edit |
| **Description** | Textarea | No | Optional, placeholder: "Describe the place — what's it like living here?" |
| **Price per month** | Number input | Yes | CAD, placeholder: "$1,200" |
| **Bedrooms** | Number select (1, 2, 3, 4, 5+) | Yes | |
| **Bathrooms** | Number select (1, 2, 3+) | Yes | |
| **Property type** | Dropdown | Yes | Options: Apartment, House, Condo, Basement, Room, Studio |
| **Amenities** | Checkboxes (multi-select) | No | See amenity list below |
| **Residency status** | Radio buttons | Yes | See residency options below |
| **University** | Dropdown | No | "Select a nearby university" with "None / Not sure" option |
| **Photos** | File upload (multiple) | No | Accept jpg, png, webp. Show preview thumbnails. Max 10 photos. |

### Amenity Options (checkboxes)

- Wifi
- Laundry (in-unit)
- Laundry (shared)
- Parking
- Gym
- AC
- Furnished
- Pets allowed
- Utilities included
- Dishwasher
- Balcony
- Basement (this is new — means the unit is a basement apartment)

### Residency Status Options (radio buttons)

Label: **"What's your living status at this address?"**

| Option | UI | Additional input |
|--------|-----|-----------------|
| Currently living here | Radio button | None |
| Last stayed | Radio button | Month + Year picker appears (e.g., "March 2025") |
| Visited / toured only | Radio button | None |

When "Last stayed" is selected, show a month dropdown (January–December) and a year dropdown (current year back to 5 years ago).

### Database Changes

```sql
-- Add new columns to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS residency_status TEXT CHECK (residency_status IN ('current', 'last_stayed', 'visited'));
ALTER TABLE listings ADD COLUMN IF NOT EXISTS last_stayed_month INTEGER;  -- 1-12
ALTER TABLE listings ADD COLUMN IF NOT EXISTS last_stayed_year INTEGER;   -- e.g., 2025

-- Make title nullable (address replaces it)
ALTER TABLE listings ALTER COLUMN title DROP NOT NULL;

-- Update amenities: no schema change needed, amenities is TEXT[] so 'basement' is just a new value
```

### Form Submission Logic

When the form submits:

1. The address was entered via Google Places Autocomplete
2. City was auto-filled (user may have edited it)
3. Latitude and longitude were resolved in the background from Google Places — store them in the database but never show them to the user
4. If no title is provided, set `title = address` in the database (for backward compatibility)
5. Upload photos to Supabase Storage, save URLs to `listing_photos`
6. Redirect to the new listing's detail page

---

## 3. Google Places Autocomplete

### Setup

Install the Google Maps JavaScript API loader:
```bash
npm install @react-google-maps/api
```

Or use the lightweight `use-places-autocomplete` hook:
```bash
npm install use-places-autocomplete
```

### Environment Variable

Add to `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

Get a key at https://console.cloud.google.com/apis/credentials. Enable the **Places API** and **Maps JavaScript API**.

### Address Input Component

Create `src/components/forms/AddressAutocomplete.tsx`:

```tsx
'use client';

import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

interface AddressResult {
  address: string;
  city: string;
  latitude: number;
  longitude: number;
}

interface Props {
  onSelect: (result: AddressResult) => void;
  defaultValue?: string;
}

export function AddressAutocomplete({ onSelect, defaultValue }: Props) {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'ca' },  // Restrict to Canada
      types: ['address'],                          // Only street addresses
    },
    defaultValue,
  });

  async function handleSelect(description: string) {
    setValue(description, false);
    clearSuggestions();

    const results = await getGeocode({ address: description });
    const { lat, lng } = getLatLng(results[0]);

    // Extract city from address components
    const cityComponent = results[0].address_components.find(
      c => c.types.includes('locality') || c.types.includes('sublocality')
    );

    onSelect({
      address: description,
      city: cityComponent?.long_name || '',
      latitude: lat,
      longitude: lng,
    });
  }

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        placeholder="Start typing an address..."
        className="w-full rounded-lg border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {status === 'OK' && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              className="cursor-pointer px-4 py-3 hover:bg-gray-50 text-sm"
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Load the Google Maps Script

In the listing form page or in the root layout, load the Google Maps script:

```tsx
import { LoadScript } from '@react-google-maps/api';

// Wrap the form (or the whole app) with:
<LoadScript
  googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
  libraries={['places']}
>
  <ListingForm />
</LoadScript>
```

Or use a `<Script>` tag in the layout:
```tsx
import Script from 'next/script';

<Script
  src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
  strategy="lazyOnload"
/>
```

### How It Works in the Form

1. User starts typing an address → Google suggests completions (restricted to Canadian addresses)
2. User selects a suggestion → `handleSelect` fires
3. City is auto-filled in the city input field (user can edit if needed)
4. Latitude and longitude are resolved silently in the background — stored in hidden state, never shown to the user
5. On form submit, lat/lng are included in the database insert

---

## 4. "Add Your Review" Button

### On University Detail Page (`/university/[slug]`)

Add a prominent "Add your review" button in the listings section. This button:
- If user is **logged in**: opens a modal or expands an inline form to add a new listing + review for this university area
- If user is **not logged in**: redirects to `/auth/login?redirect=/university/[slug]`

**Placement:** At the top of the listings section, next to the "Listings near [University]" heading. Style it as a primary blue button.

```
Listings near University of Waterloo          [+ Add Your Listing]
───────────────────────────────────────────────────────────────────
| Card | Card | Card |
```

**Behavior:** Clicking "Add Your Listing" navigates to `/listing/new?university=[slug]` which pre-selects the university in the form dropdown.

Also add a section below the listings for **university-area reviews** — these are general reviews about living near the university, not tied to a specific listing.

### University Reviews (New Feature)

Add a reviews section at the bottom of the university detail page where students can review the overall experience of living near that university.

**Database: Create a new table for university reviews:**
```sql
CREATE TABLE university_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(university_id, user_id)  -- one review per user per university
);

CREATE INDEX idx_university_reviews_university ON university_reviews(university_id);
CREATE INDEX idx_university_reviews_user ON university_reviews(user_id);

-- RLS
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
```

**University detail page layout update:**

```
[Hero Banner]
[Stats Bar]
[Map]
[Listings near University]    [+ Add Your Listing]
  listing cards...

[Reviews about living near University]    [+ Add Your Review]
  "What's it like living near [University]?"
  review cards...
  review form (if logged in)
```

The "Add Your Review" button scrolls down to the review form or opens it inline. Same upsert pattern as listing reviews — one review per user per university, editable.

### On Listing Detail Page (`/listing/[id]`)

The listing detail page already has a reviews section from Part 1/3. Make sure the "Add Your Review" / "Write a Review" button is clearly visible:

- Show it prominently at the top of the reviews section (not buried at the bottom)
- If the user already has a review: show "Edit Your Review" instead
- If not logged in: show "Log in to leave a review" with a link to `/auth/login?redirect=/listing/[id]`

**Updated reviews section layout:**

```
Reviews (12)  ★ 4.5 average        [+ Write a Review]
──────────────────────────────────────────────────
| Your review (editable)          [Edit] [Delete] |  ← only if user has one
──────────────────────────────────────────────────
| Other review cards...                            |
──────────────────────────────────────────────────
```

Clicking "Write a Review" scrolls to or reveals the review form.

---

## 5. Updated Listing Display Everywhere

Since the address is now the listing name, update these components:

### ListingCard
- Main heading: `listing.address` (not `listing.title`)
- Subtext: `listing.city`
- If address is long, truncate with ellipsis (`truncate` class)

### ListingDetail page
- Page heading: `listing.address`
- Below: `listing.city` + property type + beds + baths badges
- Show residency status badge if available:
  - "Currently living here" → green badge
  - "Last stayed: March 2025" → gray badge
  - "Visited" → light gray badge

### Map popup (when clicking a marker)
- Show address (not title) in the popup card

### Explore page cards
- Same as ListingCard — address as heading

---

## 6. Environment Variables Summary

After this update, the full `.env.local` should be:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## 7. Build Order

1. **Database migration:** Run the SQL to add `residency_status`, `last_stayed_month`, `last_stayed_year` columns to listings. Make `title` nullable. Create `university_reviews` table.
2. **Install Google Places:** `npm install use-places-autocomplete @react-google-maps/api`. Add the Google Maps API key to `.env.local`.
3. **AddressAutocomplete component:** Build the autocomplete input component.
4. **Update listing form:** Remove title field, add address autocomplete, add residency status radio buttons, add "basement" to amenities, make description/university/photos optional.
5. **Update listing display:** Replace title with address in ListingCard, ListingDetail, map popups, explore page.
6. **University reviews:** Add the reviews section to university detail pages with form + display.
7. **"Add Your Listing" button:** Add to university pages, link to `/listing/new?university=[slug]`.
8. **"Add Your Review" button:** Add prominently to both university and listing detail pages.
9. **Test:** Verify address autocomplete fills city + resolves lat/lng, review upsert works on both universities and listings, residency status saves correctly.
