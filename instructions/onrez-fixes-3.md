# OnRez — Quick Fixes: Pluralization + "New" Badge

## 1. Fix "1 listings" → "1 listing" Pluralization

**Problem:** University cards and listing counts show "1 listings" instead of "1 listing". The plural "s" should only appear when the count is not 1.

**Fix:** Find every place in the app that displays a listing count and apply proper pluralization.

**Places to check:**
- UniversityCard component (badge on the card)
- University detail page (stats bar)
- Explore page ("Showing X listings")
- Any other place that shows a count of listings or reviews

**Pattern:**
```tsx
// WRONG:
<span>{count} listings</span>

// CORRECT:
<span>{count} {count === 1 ? 'listing' : 'listings'}</span>
```

**Also apply to review counts:**
```tsx
// WRONG:
<span>({count} reviews)</span>

// CORRECT:
<span>({count} {count === 1 ? 'review' : 'reviews'})</span>
```

Create a small helper if it's used in many places:
```ts
// src/lib/utils.ts
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}

// Usage:
<span>{count} {pluralize(count, 'listing')}</span>
<span>{count} {pluralize(count, 'review')}</span>
```

---

## 2. Show "New" Badge Instead of "0.0 (0)" Ratings

**Problem:** Listings with no reviews show "★ 0.0 (0)" which looks empty and unappealing. It makes the listing look neglected rather than simply new.

**Fix:** When a listing has 0 reviews, hide the star rating entirely and show a "New" badge instead.

**ListingCard component:**
```tsx
// BEFORE:
<div className="flex items-center gap-1">
  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
  <span className="text-sm font-medium">{listing.avgRating.toFixed(1)}</span>
  <span className="text-sm text-gray-400">({listing.reviewCount})</span>
</div>

// AFTER:
{listing.reviewCount > 0 ? (
  <div className="flex items-center gap-1">
    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
    <span className="text-sm font-medium">{listing.avgRating.toFixed(1)}</span>
    <span className="text-sm text-gray-400">({listing.reviewCount} {listing.reviewCount === 1 ? 'review' : 'reviews'})</span>
  </div>
) : (
  <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
    New
  </span>
)}
```

**Apply this pattern in all these places:**
- ListingCard (used on home page, explore page, university page, bookmarks)
- ListingDetail page (the main rating display at the top of the reviews section)
- Map popup (when clicking a listing marker)
- Bottom carousel cards on the map page

**For the ListingDetail reviews section header:**
```tsx
// BEFORE:
<h2>Reviews ({listing.reviewCount}) ★ {listing.avgRating.toFixed(1)}</h2>

// AFTER:
{listing.reviewCount > 0 ? (
  <div className="flex items-center gap-3">
    <h2 className="text-xl font-bold">Reviews ({listing.reviewCount})</h2>
    <div className="flex items-center gap-1">
      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
      <span className="font-semibold">{listing.avgRating.toFixed(1)}</span>
    </div>
  </div>
) : (
  <div className="flex items-center gap-3">
    <h2 className="text-xl font-bold">Reviews</h2>
    <span className="text-sm text-gray-500">No reviews yet — be the first!</span>
  </div>
)}
```

---

## Summary

| Fix | Where |
|-----|-------|
| `count === 1 ? 'listing' : 'listings'` | UniversityCard, university detail, explore page, anywhere counts are shown |
| `count === 1 ? 'review' : 'reviews'` | ListingCard, ListingDetail, anywhere review counts are shown |
| Show "New" badge when 0 reviews | ListingCard, ListingDetail, map popups, map carousel |
| "No reviews yet — be the first!" | ListingDetail reviews section header |
