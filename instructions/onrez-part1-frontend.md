# OnRez — Frontend (Part 1 of 3)

## Overview

Build the complete frontend UI for **OnRez**, a student housing platform for Ontario universities. This document covers ONLY the frontend — no database, no backend logic, no API integration. Use mock/hardcoded data and placeholder images throughout so it is easy to swap in real data in Parts 2 and 3.

**Design philosophy:** Clean, simple, modern. Inspired by Airbnb's card layouts and Uber's minimal map UI. Avoid clutter. Generous whitespace. The design should feel trustworthy and easy to use — students are the audience.

---

## Tech Stack (Frontend Only)

| Tool | Purpose |
|------|---------|
| **Next.js 14+ (App Router)** | Framework, file-based routing |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Accessible component primitives |
| **Mapbox GL JS + react-map-gl** | Interactive map |
| **Lucide React** | Icons |
| **next/font** | Font loading |

---

## Pages & Navigation

There are **3 main pages** in the navbar plus supporting pages:

### Navbar Links:
```
[OR] OnRez           Home    Map    Explore                    Log in  [Sign up]
```

| Nav Link | Route | Description |
|----------|-------|-------------|
| **Home** | `/` | Landing page — hero search, university cards, featured listings |
| **Map** | `/map` | Full-screen interactive Ontario map with school filter dropdown and listing markers |
| **Explore** | `/explore` | Trending/popular listings grid sorted by user rating |

### Other Pages (not in nav, accessed by clicking cards/links):
| Page | Route | Description |
|------|-------|-------------|
| University Detail | `/university/[slug]` | Listings + info for a specific university |
| Listing Detail | `/listing/[id]` | Full listing page with photos, reviews, map |
| Login | `/auth/login` | Login form |
| Sign Up | `/auth/signup` | Signup form |

---

## Existing Header (MUST MATCH EXACTLY)

The header/navbar has already been designed. Replicate this exactly:

**Details:**
- Full-width, sticky top navbar
- Background: very light blue/lavender gradient (approximately `#EEF2FF` → `#E0E7FF`)
- Left: Blue rounded square logo with "OR" in white text, followed by "OnRez" in dark semibold text
- Center: Navigation links — **"Home"**, **"Map"**, **"Explore"** — each with a small Lucide icon to the left (Home icon, Map icon, Compass icon). Text is medium gray, ~14-15px
- Right: "Log in" as plain text link, "Sign up" as a blue filled button with white text and rounded corners
- Subtle bottom border or shadow
- The logo blue matches the "Sign up" button blue (approximately `#3B5BDB`)
- On mobile: collapse nav links into a hamburger menu

---

## Global Design System

**Colors:**
- Primary blue: `#3B5BDB` (logo, buttons, active states, links)
- Light background: `#F8FAFC` (page backgrounds, alternating sections)
- White: `#FFFFFF` (cards, panels)
- Dark text: `#1E293B` (headings)
- Medium text: `#64748B` (body, descriptions)
- Light border: `#E2E8F0`
- Price green: `#16A34A` (price badges on map)
- Star yellow: `#F59E0B` (ratings)

**Typography:**
- Clean sans-serif via `next/font/google` — DM Sans or Plus Jakarta Sans (NOT Inter, NOT Roboto)
- Headings: semibold or bold
- Body: regular, 15-16px base

**Component style:**
- Cards: white bg, `rounded-xl`, `shadow-sm`, hover → `shadow-md` with smooth transition
- Buttons: `rounded-lg`, primary is filled blue, secondary is outline
- Inputs: `rounded-lg`, light gray border, focus ring in primary blue
- Spacing: generous padding (p-5 or p-6 in cards), consistent gaps (gap-6)
- Transitions: `transition-all duration-200` on interactive elements
- No glassmorphism, no dark mode for now

---

## Project Structure

```
onrez/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (Navbar + Footer)
│   │   ├── page.tsx                    # Home / Landing page
│   │   ├── map/
│   │   │   └── page.tsx                # Full-screen interactive map
│   │   ├── explore/
│   │   │   └── page.tsx                # Trending listings grid
│   │   ├── university/
│   │   │   └── [slug]/
│   │   │       └── page.tsx            # University detail page
│   │   ├── listing/
│   │   │   └── [id]/
│   │   │       └── page.tsx            # Listing detail page
│   │   └── auth/
│   │       ├── login/page.tsx
│   │       └── signup/page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── map/
│   │   │   ├── MapView.tsx             # Mapbox GL wrapper
│   │   │   ├── ListingMarker.tsx       # Price pill marker
│   │   │   ├── MapControls.tsx         # Toggle buttons (transit, food, shops)
│   │   │   ├── SchoolFilter.tsx        # Dropdown to filter/zoom by university
│   │   │   ├── BusStopLayer.tsx        # Bus stop markers (mock)
│   │   │   └── AmenityLayer.tsx        # Food/shopping markers (mock)
│   │   ├── listings/
│   │   │   ├── ListingCard.tsx         # Airbnb-style card
│   │   │   ├── ListingGrid.tsx         # Responsive grid
│   │   │   ├── ListingGallery.tsx      # Photo lightbox
│   │   │   └── ListingDetail.tsx       # Full detail layout
│   │   ├── reviews/
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── ReviewForm.tsx          # Star selector + text (UI only)
│   │   │   └── StarRating.tsx
│   │   ├── filters/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterPanel.tsx         # Price slider, bedrooms, property type
│   │   │   └── SortDropdown.tsx
│   │   ├── university/
│   │   │   ├── UniversityHero.tsx
│   │   │   └── UniversityCard.tsx
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       └── SignupForm.tsx
│   ├── data/
│   │   ├── universities.ts            # Hardcoded mock data
│   │   ├── listings.ts                # Hardcoded mock data
│   │   ├── reviews.ts                 # Hardcoded mock data
│   │   └── nearby.ts                  # Hardcoded mock nearby places
│   ├── types/
│   │   └── index.ts
│   └── lib/
│       └── utils.ts                   # cn() helper, formatters
├── public/
│   └── images/                        # Placeholder images
├── .env.local                         # NEXT_PUBLIC_MAPBOX_TOKEN
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## TypeScript Interfaces

```ts
interface University {
  id: string;
  name: string;                  // "University of Waterloo"
  slug: string;                  // "waterloo"
  city: string;
  latitude: number;
  longitude: number;
  description: string;
  logoUrl: string;               // placeholder URL
  coverImageUrl: string;         // placeholder URL
  listingCount: number;
  avgRent: number;
}

interface Listing {
  id: string;
  title: string;                 // "Bright 2BR near UW Campus"
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  pricePerMonth: number;         // CAD
  bedrooms: number;
  bathrooms: number;
  propertyType: 'apartment' | 'house' | 'condo' | 'basement' | 'room' | 'studio';
  amenities: string[];
  images: string[];              // placeholder URLs
  universitySlug: string;
  avgRating: number;
  reviewCount: number;
  availableFrom: string;
  description: string;
}

interface Review {
  id: string;
  listingId: string;
  userName: string;
  avatarUrl: string;             // placeholder URL
  rating: number;                // 1-5
  comment: string;
  createdAt: string;
}

interface NearbyPlace {
  id: string;
  name: string;
  type: 'bus_stop' | 'restaurant' | 'shopping';
  latitude: number;
  longitude: number;
}
```

---

## Mock Data

All data lives in `src/data/` as hardcoded TypeScript arrays. Use placeholder image URLs throughout. This makes it trivial to swap in real Supabase data later — just replace the import.

### Universities (`src/data/universities.ts`)

10 Ontario universities with real coordinates:

| Name | Slug | City | Lat | Lng |
|------|------|------|-----|-----|
| University of Waterloo | waterloo | Waterloo | 43.4723 | -80.5449 |
| University of Toronto | uoft | Toronto | 43.6629 | -79.3957 |
| Western University | western | London | 43.0096 | -81.2737 |
| McMaster University | mcmaster | Hamilton | 43.2609 | -79.9192 |
| Queen's University | queens | Kingston | 44.2253 | -76.4951 |
| University of Ottawa | uottawa | Ottawa | 45.4231 | -75.6831 |
| Toronto Metropolitan University | tmu | Toronto | 43.6577 | -79.3788 |
| York University | york | Toronto | 43.7735 | -79.5019 |
| Wilfrid Laurier University | laurier | Waterloo | 43.4738 | -80.5275 |
| University of Guelph | guelph | Guelph | 43.5327 | -80.2262 |

Use placeholder images for `coverImageUrl` and `logoUrl`.

### Listings (`src/data/listings.ts`)

30-40 sample listings spread across all universities. Realistic addresses near each campus, prices $500–$2,500/mo, mix of property types. 3-5 placeholder image URLs per listing. Short 2-3 sentence descriptions.

### Reviews (`src/data/reviews.ts`)

50-80 sample reviews across listings. Mostly 3-5 star ratings. Realistic student-perspective comments. Placeholder avatar URLs.

### Nearby Places (`src/data/nearby.ts`)

20-30 mock bus stops, restaurants, shopping spots near each university.

---

## Placeholder Image Strategy

Use placeholder URLs everywhere so swapping to real images later is just a URL change:

```ts
// Listing photos
`https://placehold.co/600x400/E2E8F0/64748B?text=Listing+Photo+${n}`

// University covers
`https://placehold.co/800x400/EEF2FF/3B5BDB?text=${universityName}`

// University logos
`https://placehold.co/80x80/3B5BDB/FFFFFF?text=${slug.toUpperCase()}`

// User avatars
`https://placehold.co/40x40/E2E8F0/64748B?text=${initials}`
```

---

## Page Specifications

### 1. Home / Landing Page (`/`)

**A) Hero Section**
- Light background (subtle gradient or same tone as navbar)
- Large heading: **"Find your next home near campus"**
- Subheading: "Browse student-friendly rentals near Ontario's top universities"
- Wide search bar: university dropdown on left, keyword input in middle, blue "Search" button on right. Rounded, subtle shadow. Submitting navigates to `/map?university=slug` (if university selected) or `/explore?q=keyword`

**B) Browse by University**
- Section heading: "Browse by University"
- Grid of UniversityCards — 2 cols mobile, 3 tablet, 5 desktop
- Each card: placeholder cover image at top (~160px, rounded top), university name (semibold), city (gray), "X listings" (small text)
- Whole card clickable → `/university/[slug]`
- Hover: lift + shadow

**C) Top Rated Listings**
- Section heading: "Top Rated Listings"
- Horizontal scrollable row with left/right arrows on desktop
- 8-10 highest-rated ListingCards from mock data
- Each card: placeholder photo (16:10), price bold, title, city, star rating + review count
- Clickable → `/listing/[id]`

**D) Footer**
- OnRez logo + copyright left, nav links center, "Built for Ontario students" right
- Light gray background

---

### 2. Map Page (`/map`)

This is the **main search/discovery tool**. Full-screen map experience.

**Layout:** Full viewport height (100vh minus navbar). The map fills the entire screen. UI elements float on top of the map.

**Floating UI on the map:**

**Top-left: School Filter**
- A dropdown/select floating over the map
- Options: "All Universities" (default), then each of the 10 universities
- Selecting a university smoothly flies the map to that campus area (zoom ~14)
- Selecting "All Universities" zooms back out to Ontario view
- Styled: white background, rounded-lg, shadow-md

**Top-left below school filter: Layer Toggles**
- Row of toggle buttons:
  - 🚌 Transit (bus stops)
  - 🍽️ Food
  - 🛒 Shops
- White background, rounded, icon + label
- Active state: filled primary blue background, white text
- Each toggle shows/hides the corresponding marker layer

**Top-right: Mapbox NavigationControl** (zoom +/-)

**Map content:**
- Default view: centered on Ontario (~43.7, -79.5, zoom ~6), showing all listing markers
- Listing markers: **price pill badges** — rounded pill, dark background (`bg-gray-900`), white text, showing "$1,200". On hover: scale up + change to primary blue. On click: popup with photo thumbnail, title, price, rating, "View listing →" link to `/listing/[id]`
- University markers: slightly larger blue circle with label (e.g., "UW", "UofT"). Always visible.
- Bus stops: small 8px blue dots (when Transit toggle is on)
- Restaurants: small 8px orange dots (when Food toggle is on)
- Shopping: small 8px purple dots (when Shops toggle is on)

**Bottom: Listing Preview Carousel**
- When zoomed into a university area, show a horizontal scrollable row of compact ListingCards at the bottom
- ~3-4 cards visible, listings currently in the map viewport
- Each card: small placeholder photo, title, price, rating. Clickable → `/listing/[id]`
- Hides when zoomed out to Ontario-level

---

### 3. Explore Page (`/explore`)

A **browsable, filterable grid** of all listings sorted by user rating (popular first).

**Top Section:**
- Heading: "Explore Popular Listings"
- Subheading: "Top-rated student housing across Ontario"
- SearchBar: keyword input + university dropdown inline

**Filter Bar (horizontal, below search):**
- Price range: dual-handle slider with "$X — $Y" labels
- Bedrooms: pill buttons (Any, 1, 2, 3, 4+)
- Property type: dropdown or pill buttons (All, Apartment, House, Condo, Basement, Room, Studio)
- Sort: dropdown — "Top Rated" (default), "Price: Low → High", "Price: High → Low", "Most Reviews", "Newest"
- "Clear all" text button

**Listing Grid:**
- Responsive: 1 col mobile, 2 cols tablet, 3-4 cols desktop
- Count: "Showing 36 listings"
- ListingCards — Airbnb-style:
  - Placeholder photo (16:10, rounded top)
  - Price/mo (bold)
  - Title
  - City + university name (gray)
  - Star rating (yellow) + "X reviews"
  - Property type badge
- Hover: lift + shadow
- Click → `/listing/[id]`
- "Load more" button at bottom

**Default sort:** `avgRating` descending. This is the "trending" logic — will be powered by real user ratings from database in Part 2.

---

### 4. University Detail Page (`/university/[slug]`)

**A) Hero Banner**
- Full-width placeholder cover image with dark gradient overlay
- University name (large, white, bold) + city
- Description below

**B) Stats Bar**
- 3 stat cards: "Average Rent: $X,XXX/mo", "X Listings", "Avg Rating: 4.X ★"

**C) Map**
- Embedded Mapbox (~400px tall), zoomed to university
- Listing markers + university pin
- Toggle buttons for transit/food/shops

**D) Listings Grid**
- "Listings near [University]"
- 2-3 col grid of ListingCards for this university
- First 12, "Show more" to expand

---

### 5. Listing Detail Page (`/listing/[id]`)

**A) Photo Gallery**
- 1 large placeholder image (left ~60%) + up to 4 smaller thumbnails (right 2×2)
- "Show all photos" → lightbox modal
- Rounded corners

**B) Info Header**
- Title (large, bold)
- Address + city (gray)
- Badges: property type, bedrooms, bathrooms
- Price: "$X,XXX/mo" (right-aligned or sticky sidebar on desktop)

**C) Description + Amenities**
- Description paragraph
- Amenities: icon + label tag grid

**D) Location Map**
- Small map (~300px), listing pin centered
- Toggle buttons for nearby amenities
- "Near [University]" link

**E) Reviews Section**
- "Reviews (X)" + average stars
- ReviewCards: placeholder avatar, name, date, stars, comment
- ReviewForm (UI only): star selector, textarea, "Submit Review" button
- "Log in to leave a review" message

---

### 6. Auth Pages (`/auth/login`, `/auth/signup`)

- Centered card, max-width ~400px
- Login: email, password, "Log in" button, signup link
- Signup: name, email, password, confirm password, "Sign up" button, login link
- UI only, no auth logic

---

## Environment Variables

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
```

Free at https://account.mapbox.com/access-tokens/

---

## Build Order

1. **Setup:** Init Next.js + TS + Tailwind + shadcn/ui. Install `react-map-gl`, `mapbox-gl`, `lucide-react`. Set up font.
2. **Layout + Navbar:** Root layout with exact Navbar (Home, Map, Explore) and Footer. Sticky, responsive hamburger on mobile.
3. **Mock Data:** Create all `src/data/` files with placeholder URLs.
4. **Shared Components:** ListingCard, UniversityCard, StarRating, SearchBar.
5. **Home Page:** Hero search bar, university cards grid, top-rated listings row.
6. **Map Page:** Full-screen Mapbox map, school filter dropdown, price-pill markers, layer toggles, bottom listing carousel.
7. **Explore Page:** Filter bar, listing grid sorted by rating, load more.
8. **University Detail Page:** Hero, stats, map, listings grid.
9. **Listing Detail Page:** Photo gallery, info, amenities, map, reviews + form.
10. **Auth Pages:** Login + signup forms (UI only).
11. **Polish:** Hover states, transitions, responsive pass (especially Map page mobile), loading skeletons, empty states.

---

## Important Notes

- ALL data is hardcoded mock for this phase. Every image is a placeholder URL.
- The Mapbox map should be fully interactive with real tiles — only the data is mock.
- Use `react-map-gl`'s `<Marker>` to render JSX price pills directly.
- Dynamic import map components with `{ ssr: false }` for Next.js compatibility.
- Every page must be responsive (mobile-first with Tailwind breakpoints).
- Use shadcn/ui for: Button, Input, Select, Slider, Dialog, DropdownMenu, Checkbox, Textarea.
- Use Lucide React for all icons.
- Do NOT install or configure Supabase — that is Part 2.
- The review form is UI only. Rating sort uses hardcoded `avgRating` values.
