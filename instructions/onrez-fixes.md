# OnRez — Bug Fixes & UI Tweaks

## 1. Search Bar Focus Ring (Landing Page + Explore Page)

**Problem:** When clicking the search bar input, a bold blue focus outline/box appears. It's too prominent and distracting.

**Fix:** Replace the default focus ring with a subtle one. Find the search bar input styling and change:

```css
/* REMOVE or REPLACE this: */
focus:ring-2 focus:ring-blue-500
focus:outline-blue-500
/* or any default browser outline */

/* REPLACE WITH: */
focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400
```

Or remove the focus ring entirely and just darken the border slightly on focus:
```css
focus:outline-none focus:border-gray-400 transition-colors
```

Apply this to ALL search bar inputs across the app (landing page hero search, explore page search, map page if applicable).

---

## 2. Footer — Remove Nav Links

**Problem:** The footer currently includes "Home, Map, Explore" navigation links. These are redundant with the navbar.

**Fix:** Remove the navigation links from the Footer component. The footer should only contain:

- Left: OnRez logo + "© 2026 OnRez"
- Right: "Built for Ontario students" tagline

Keep it minimal. No nav links, no extra link columns.

```
┌─────────────────────────────────────────────────────────┐
│  [OR] OnRez  © 2026 OnRez          Built for Ontario students  │
└─────────────────────────────────────────────────────────┘
```

Apply to both the Home page and Explore page footers (it's the same Footer component so one change fixes both).

---

## 3. University Markers on Map — Use School Logos

**Problem:** University markers on the map need a clear, recognizable icon. Text abbreviations (UW, UWO, etc.) are inconsistent and hard to read at small sizes.

**Fix:** Use each university's **logo image** as the map marker instead of text abbreviations.

**Implementation:**

For each university, use a circular marker with the school's logo inside:

```tsx
// University marker on the map
<Marker latitude={uni.latitude} longitude={uni.longitude}>
  <div className="relative cursor-pointer group" onClick={() => handleUniversityClick(uni)}>
    {/* Circle container with logo */}
    <div className="w-10 h-10 rounded-full bg-white border-2 border-primary-blue shadow-lg overflow-hidden flex items-center justify-center">
      <img
        src={uni.logoUrl}
        alt={uni.name}
        className="w-8 h-8 object-contain"
      />
    </div>
    {/* Tooltip on hover showing full name */}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
      {uni.name}
    </div>
  </div>
</Marker>
```

**Logo images:** If you don't have real university logos yet, use placeholder circles with the school's initials as a fallback:

```tsx
{uni.logoUrl ? (
  <img src={uni.logoUrl} alt={uni.name} className="w-8 h-8 object-contain" />
) : (
  <span className="text-xs font-bold text-primary-blue">
    {getInitials(uni.name)}
  </span>
)}
```

Where `getInitials` returns:
- University of Waterloo → "UW"
- University of Toronto → "UofT"
- Western University → "Western"
- McMaster University → "Mac"
- Queen's University → "Queen's"
- University of Ottawa → "uOttawa"
- Toronto Metropolitan University → "TMU"
- York University → "York"
- Wilfrid Laurier University → "WLU"
- University of Guelph → "UofG"

The logo approach is preferred. Once you have real logo images, swap the placeholder URLs.

---

## 4. Map Page — Click University Marker to Zoom In

**Problem:** Clicking a university marker on the map does nothing. It should zoom into that university's area.

**Fix:** Add an `onClick` handler to university markers that flies the map to that location.

```tsx
function handleUniversityClick(university: University) {
  mapRef.current?.flyTo({
    center: [university.longitude, university.latitude],
    zoom: 14,
    duration: 1500,  // smooth 1.5 second animation
    essential: true,
  });
}
```

**Marker with click handler:**
```tsx
<Marker latitude={uni.latitude} longitude={uni.longitude}>
  <div
    className="cursor-pointer"
    onClick={() => handleUniversityClick(uni)}
  >
    {/* logo circle markup from above */}
  </div>
</Marker>
```

**After zooming in:**
- The listing markers in that area become visible (if using clustering, they uncluster)
- The bottom listing carousel should appear showing nearby listings
- The school filter dropdown at the top-left should update to reflect the selected university

---

## 5. Map Page — School Filter Dropdown Zooms to Selected School

**Problem:** Selecting a school from the dropdown filter at the top-left of the map does not zoom into that school's area.

**Fix:** Wire the dropdown `onChange` to fly the map to the selected university.

```tsx
function handleSchoolFilterChange(slug: string | null) {
  if (!slug || slug === 'all') {
    // "All Universities" selected — zoom back out to Ontario
    mapRef.current?.flyTo({
      center: [-79.5, 43.7],
      zoom: 6,
      duration: 1500,
      essential: true,
    });
    setSelectedUniversity(null);
    return;
  }

  // Find the university by slug
  const uni = universities.find(u => u.slug === slug);
  if (uni) {
    mapRef.current?.flyTo({
      center: [uni.longitude, uni.latitude],
      zoom: 14,
      duration: 1500,
      essential: true,
    });
    setSelectedUniversity(uni);
  }
}
```

**Sync between marker click and dropdown:** When a user clicks a university marker, ALSO update the dropdown to show that university as selected. And vice versa — when the dropdown changes, the map zooms. They should stay in sync.

```tsx
// In the SchoolFilter dropdown:
<Select value={selectedUniversity?.slug || 'all'} onValueChange={handleSchoolFilterChange}>
  <SelectItem value="all">All Universities</SelectItem>
  {universities.map(uni => (
    <SelectItem key={uni.slug} value={uni.slug}>{uni.name}</SelectItem>
  ))}
</Select>
```

**Important:** Make sure the `mapRef` is properly set up:
```tsx
import { useRef } from 'react';
import Map, { MapRef } from 'react-map-gl';

const mapRef = useRef<MapRef>(null);

<Map ref={mapRef} ...>
```

---

## Summary of Changes

| # | What | Where |
|---|------|-------|
| 1 | Subtle or remove search bar focus ring | Landing page, Explore page |
| 2 | Remove nav links from footer | Footer component (all pages) |
| 3 | Use school logos for university markers | Map page |
| 4 | Click university marker → zoom in | Map page |
| 5 | School filter dropdown → zoom in | Map page |
| + | Sync dropdown and marker click state | Map page |
