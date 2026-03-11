# OnRez — Design Polish: Landing Page & Overall Visual Upgrade

## Problem

The site currently looks generic and "vibe coded" — flat placeholder cards, monotone light blue everywhere, no imagery, no visual depth. It needs to feel like a real, polished product that students would trust and want to use.

**Design direction:** Clean, confident, modern — like Airbnb meets a premium real estate site. NOT startup-y or playful. Think: trustworthy, clear, photographic.

---

## 1. Hero Section — Full Photo Background with Overlay

Replace the current plain light blue hero with a full-width photograph + dark overlay.

**Implementation:**

```tsx
<section className="relative h-[520px] flex items-center justify-center">
  {/* Background image — use a wide campus/city photo */}
  <div className="absolute inset-0">
    <img
      src="/images/hero-bg.jpg"
      alt=""
      className="w-full h-full object-cover"
    />
    {/* Dark gradient overlay for text readability */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
  </div>

  {/* Content on top */}
  <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
      Find your next home near campus
    </h1>
    <p className="text-lg text-white/80 mb-8">
      Browse student-friendly rentals near Ontario's top universities
    </p>

    {/* Search bar — chunky, prominent, floating white card */}
    <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.2)] p-3 flex items-center gap-3 max-w-2xl mx-auto">
      {/* University dropdown — larger padding + font */}
      <select className="flex-1 px-5 py-4 rounded-xl bg-gray-50 border-none text-base font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer">
        <option>All universities</option>
        {/* ... university options */}
      </select>

      {/* Divider */}
      <div className="w-px h-10 bg-gray-200" />

      {/* Keyword input — larger padding + font, no icons */}
      <input
        type="text"
        placeholder="Search by keyword..."
        className="flex-1 px-5 py-4 text-base focus:outline-none"
      />

      {/* Search button — taller, wider, more presence */}
      <button className="bg-primary-blue text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap">
        Search
      </button>
    </div>
  </div>
</section>
```

**Hero image:** Use a wide, high-quality photo. Good options:
- An aerial/drone shot of a university campus
- A Toronto skyline at golden hour
- A street-level shot of a charming residential neighbourhood near a campus
- Save it as `/public/images/hero-bg.jpg` (aim for ~1920x800px, compressed to <300KB)

**Key design details:**
- The search bar should look like it's floating — white card with a strong soft shadow (`shadow-[0_8px_40px_rgba(0,0,0,0.2)]`) and `rounded-2xl` on the dark photo background creates strong contrast
- The search bar should feel **chunky and prominent** — it's the primary interaction point on the page. Use `py-4` padding on all inputs/buttons (not `py-3`), `text-base` font size (not `text-sm`), and `p-3` outer padding on the container. It should feel substantial, not delicate.
- No icons inside the input fields — keep it clean, just text and the dropdown
- Text is white on the dark overlay — high contrast, easy to read
- The gradient overlay goes from 60% black at top to 70% at bottom so the search bar area is darker and text pops

---

## 2. University Cards — Photo-First Design

Replace the empty blue placeholder boxes with real campus photos.

**New card design:**

```tsx
<Link href={`/university/${uni.slug}`} className="group block">
  <div className="relative overflow-hidden rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
    {/* Campus photo — full card background */}
    <div className="relative h-48 overflow-hidden">
      <img
        src={uni.coverImageUrl}
        alt={uni.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      {/* Subtle dark gradient at bottom for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Listing count badge — top right */}
      <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-medium px-2.5 py-1 rounded-full text-gray-700">
        {uni.listingCount} listings
      </span>
    </div>

    {/* Info below photo */}
    <div className="bg-white p-4">
      <h3 className="font-semibold text-gray-900 group-hover:text-primary-blue transition-colors">
        {uni.name}
      </h3>
      <p className="text-sm text-gray-500 mt-0.5">{uni.city}, Ontario</p>
    </div>
  </div>
</Link>
```

**Key differences from current design:**
- Photo takes up most of the card (no more empty colored rectangle)
- Photo zooms slightly on hover (`group-hover:scale-105`) — subtle, polished
- Card has white bottom section with name and city
- Listing count is a small badge floating on the photo, not inline text
- Shadow increases on hover

**Campus photos to find (save to `/public/images/universities/`):**

| University | Filename | Photo suggestion |
|-----------|----------|-----------------|
| University of Waterloo | `waterloo.jpg` | MC building or the geese-filled campus green |
| University of Toronto | `uoft.jpg` | University College or King's College Circle |
| Western University | `western.jpg` | UC Hill or Middlesex College |
| McMaster University | `mcmaster.jpg` | University Hall or campus aerial |
| Queen's University | `queens.jpg` | Grant Hall or the limestone buildings |
| University of Ottawa | `uottawa.jpg` | Tabaret Hall |
| Toronto Metropolitan University | `tmu.jpg` | Student Learning Centre or Gould St campus |
| York University | `york.jpg` | Vari Hall or campus aerial |
| Wilfrid Laurier University | `laurier.jpg` | Arts building or campus quad |
| University of Guelph | `guelph.jpg` | Johnston Hall |

**Image specs:** Aim for ~800x500px, compressed JPEG, <150KB each. These are card images, not hero-sized.

Update the `coverImageUrl` in the database or seed data:
```ts
// From:
coverImageUrl: 'https://placehold.co/800x400/EEF2FF/3B5BDB?text=University+of+Waterloo'

// To:
coverImageUrl: '/images/universities/waterloo.jpg'
```

---

## 3. Section Backgrounds — Break the Monotone

The whole page is currently the same light blue. Create visual rhythm by alternating section backgrounds.

```tsx
{/* Hero — dark photo (already fixed above) */}

{/* Browse by University — white background */}
<section className="bg-white py-16 px-4">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse by University</h2>
    <p className="text-gray-500 mb-8">Find housing near Ontario's top campuses</p>
    {/* University card grid */}
  </div>
</section>

{/* Top Rated Listings — very light gray */}
<section className="bg-gray-50 py-16 px-4">
  <div className="max-w-6xl mx-auto">
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Top Rated Listings</h2>
    <p className="text-gray-500 mb-8">Highest-rated rentals from verified students</p>
    {/* Listing cards scroll row */}
  </div>
</section>

{/* Optional: CTA section before footer */}
<section className="bg-primary-blue py-16 px-4 text-center">
  <h2 className="text-2xl font-bold text-white mb-3">Know a great place?</h2>
  <p className="text-blue-100 mb-6">Help other students find their next home</p>
  <Button variant="secondary" className="bg-white text-primary-blue hover:bg-gray-100 font-medium px-6 py-3 rounded-xl">
    Post a Listing
  </Button>
</section>
```

**Pattern:** Dark hero → White section → Light gray section → Blue CTA → Footer. This creates natural visual breaks between content areas.

---

## 4. Listing Cards — More Visual Weight

The listing cards in the "Top Rated" row should also feel photo-forward:

```tsx
<Link href={`/listing/${listing.id}`} className="group block min-w-[280px] max-w-[300px] flex-shrink-0">
  <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
    {/* Photo */}
    <div className="relative h-44 overflow-hidden">
      <img
        src={listing.images[0] || '/images/placeholder-listing.jpg'}
        alt={listing.address}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      {/* Price badge on photo */}
      <span className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm text-sm font-bold px-3 py-1.5 rounded-lg shadow-sm">
        ${listing.pricePerMonth.toLocaleString()}/mo
      </span>
      {/* Bookmark heart — top right */}
      <BookmarkButton className="absolute top-3 right-3" />
    </div>

    {/* Info */}
    <div className="bg-white p-4">
      <h3 className="font-medium text-gray-900 truncate">{listing.address}</h3>
      <p className="text-sm text-gray-500 mt-0.5">{listing.city}</p>
      <div className="flex items-center gap-1 mt-2">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">{listing.avgRating.toFixed(1)}</span>
        <span className="text-sm text-gray-400">({listing.reviewCount})</span>
      </div>
    </div>
  </div>
</Link>
```

**Key details:**
- Price badge floats on the photo (bottom-left) — not below it
- Photo has subtle zoom on hover
- Star rating uses a filled yellow star icon, not just text
- Card is compact but has breathing room (p-4)

---

## 5. Typography Upgrade

If still using a generic font, switch to something with more character:

```tsx
// src/app/layout.tsx
import { DM_Sans } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
});

// In tailwind.config.ts:
fontFamily: {
  sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
}
```

DM Sans is clean but has slightly more personality than Inter. Alternatively, try **Plus Jakarta Sans** or **Outfit** for a more modern feel.

---

## 6. Micro-interactions & Polish

Add these small touches throughout:

**Staggered card entrance animation:**
```css
/* Add to global CSS */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;
}
```

```tsx
{/* Apply staggered delays to cards */}
{universities.map((uni, i) => (
  <div key={uni.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
    <UniversityCard university={uni} />
  </div>
))}
```

**Smooth scroll for horizontal listing row:**
```tsx
<div className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
  {listings.map(listing => (
    <div key={listing.id} className="snap-start">
      <ListingCard listing={listing} />
    </div>
  ))}
</div>
```

**Search bar shadow pulse on page load (draws attention):**
```css
@keyframes subtlePulse {
  0%, 100% { box-shadow: 0 10px 40px rgba(0,0,0,0.15); }
  50% { box-shadow: 0 10px 50px rgba(0,0,0,0.25); }
}

.search-bar-hero {
  animation: subtlePulse 3s ease-in-out 1;
}
```

---

## 7. Quick Wins Checklist

These are small CSS changes that collectively make a big difference:

- [ ] Hero: photo background + dark overlay + white floating search bar
- [ ] University cards: real campus photos with hover zoom
- [ ] Section backgrounds alternate: white → gray-50 → blue CTA
- [ ] Listing cards: price badge on photo, not below
- [ ] Add a "Post a Listing" CTA section before the footer (blue background, white text)
- [ ] Cards have `shadow-sm` default, `shadow-md` on hover with `transition-all duration-300`
- [ ] Staggered fade-in animation on university cards
- [ ] Yellow filled stars for ratings (not outline/gray stars)
- [ ] Remove all remaining `placehold.co` URLs — replace with real photos or `/images/` local files
- [ ] Ensure the horizontal listing scroll row has left/right arrow buttons on desktop
- [ ] Footer stays minimal (logo + copyright + tagline, no nav links)

---

## Image Files Needed

Save these to `/public/images/`:

```
/public/images/
├── hero-bg.jpg                      ← Wide campus/city photo (~1920x800, <300KB)
├── placeholder-listing.jpg          ← Generic apartment interior fallback (~600x400)
└── universities/
    ├── waterloo.jpg                 ← Each ~800x500, <150KB
    ├── uoft.jpg
    ├── western.jpg
    ├── mcmaster.jpg
    ├── queens.jpg
    ├── uottawa.jpg
    ├── tmu.jpg
    ├── york.jpg
    ├── laurier.jpg
    └── guelph.jpg
```

Once you have the photos, update the `coverImageUrl` for each university in the database (via Supabase table editor or a migration):

```sql
UPDATE universities SET cover_image_url = '/images/universities/waterloo.jpg' WHERE slug = 'waterloo';
UPDATE universities SET cover_image_url = '/images/universities/uoft.jpg' WHERE slug = 'uoft';
UPDATE universities SET cover_image_url = '/images/universities/western.jpg' WHERE slug = 'western';
UPDATE universities SET cover_image_url = '/images/universities/mcmaster.jpg' WHERE slug = 'mcmaster';
UPDATE universities SET cover_image_url = '/images/universities/queens.jpg' WHERE slug = 'queens';
UPDATE universities SET cover_image_url = '/images/universities/uottawa.jpg' WHERE slug = 'uottawa';
UPDATE universities SET cover_image_url = '/images/universities/tmu.jpg' WHERE slug = 'tmu';
UPDATE universities SET cover_image_url = '/images/universities/york.jpg' WHERE slug = 'york';
UPDATE universities SET cover_image_url = '/images/universities/laurier.jpg' WHERE slug = 'laurier';
UPDATE universities SET cover_image_url = '/images/universities/guelph.jpg' WHERE slug = 'guelph';
```
