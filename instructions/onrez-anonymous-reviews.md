# OnRez — Anonymous Reviews with Random Avatar Icons

## Overview

Redesign the review system so that reviews are **anonymous** — no display names are shown or asked for. Instead, each review gets a randomly assigned avatar icon (from a set of fun icons like fruits, animals, etc.) and the review layout is updated to be cleaner.

---

## 1. Remove Display Name from Reviews

**Remove from the review form:**
- Remove the "Display Name" input field from the ReviewForm component
- Users only need to: select a star rating, write their comment, and submit
- No name is collected or shown

**Remove from review display:**
- ReviewCard no longer shows a user name
- Replace the name with the randomly assigned avatar icon only

---

## 2. Random Avatar Icons

### How It Works

When a review is created, randomly assign one of the available avatar icons. Store the chosen icon filename in the database so it stays consistent (the same review always shows the same icon — it doesn't change on refresh).

### Database Change

```sql
-- Add avatar_icon column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS avatar_icon TEXT;

-- Also add to university_reviews table if it exists
ALTER TABLE university_reviews ADD COLUMN IF NOT EXISTS avatar_icon TEXT;
```

### Avatar Icon Files

Save 5-10 icon images to `/public/images/avatars/`:

```
/public/images/avatars/
├── avatar-1.png
├── avatar-2.png
├── avatar-3.png
├── avatar-4.png
├── avatar-5.png
├── avatar-6.png
├── avatar-7.png
├── avatar-8.png
├── avatar-9.png
└── avatar-10.png
```

(The actual images will be fun icons — fruits, dogs, cats, etc. — provided separately.)

### Avatar Assignment Logic

When submitting a review, randomly pick one avatar icon and save it:

```ts
// src/lib/utils.ts
const AVATAR_COUNT = 10; // update this to match the number of images you have

export function getRandomAvatar(): string {
  const index = Math.floor(Math.random() * AVATAR_COUNT) + 1;
  return `/images/avatars/avatar-${index}.png`;
}
```

**On review submit:**
```ts
const avatarIcon = getRandomAvatar();

const { error } = await supabase
  .from('reviews')
  .upsert(
    {
      listing_id: listingId,
      user_id: userId,
      rating,
      comment,
      avatar_icon: avatarIcon,  // save the randomly chosen icon
      updated_at: new Date().toISOString()
    },
    { onConflict: 'listing_id,user_id' }
  );
```

**Important:** Only assign a new random avatar when **creating** a review for the first time. If the user is **editing** their existing review, keep the same `avatar_icon` they already have — don't re-randomize it.

```ts
// When submitting:
const avatarIcon = existingReview?.avatar_icon || getRandomAvatar();
```

---

## 3. Updated Review Card Layout

The new ReviewCard layout stacks vertically: avatar + stars on top, comment below, date at the bottom.

```tsx
function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="flex gap-4 py-5 border-b border-gray-100 last:border-none">
      {/* Avatar icon — left side */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
          <img
            src={review.avatar_icon || '/images/avatars/avatar-1.png'}
            alt="Reviewer"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Content — right side, stacked */}
      <div className="flex-1">
        {/* Star rating */}
        <div className="flex items-center gap-1 mb-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "w-4 h-4",
                star <= review.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              )}
            />
          ))}
        </div>

        {/* Comment text */}
        {review.comment && (
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            {review.comment}
          </p>
        )}

        {/* Date */}
        <p className="text-xs text-gray-400">
          {formatRelativeDate(review.created_at)}
        </p>
      </div>
    </div>
  );
}
```

**Layout visual:**
```
┌──────────────────────────────────────┐
│  [🍎]   ★★★★☆                       │
│         Great place, close to campus │
│         and very quiet neighborhood. │
│         2 months ago                 │
├──────────────────────────────────────┤
│  [🐕]   ★★★☆☆                       │
│         Decent but landlord is slow  │
│         to fix things.               │
│         5 months ago                 │
└──────────────────────────────────────┘
```

**Key details:**
- No display name anywhere
- Avatar icon is a small circle (w-10 h-10) on the left
- Stars are directly to the right of the avatar, at the top
- Comment text below the stars
- Relative date at the bottom in small gray text ("2 months ago", "March 2026")
- Reviews separated by a subtle bottom border

---

## 4. Updated Review Form

Remove the display name field. The form is now just stars + comment + submit.

```tsx
function ReviewForm({ listingId, existingReview, onReviewSubmitted }: Props) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="font-semibold text-gray-900 mb-4">
        {existingReview ? 'Edit Your Review' : 'Leave a Review'}
      </h3>

      {/* Star selector — clickable */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <Star
              className={cn(
                "w-7 h-7 cursor-pointer transition-colors",
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200 hover:fill-yellow-200 hover:text-yellow-200"
              )}
            />
          </button>
        ))}
      </div>

      {/* Comment — no display name field */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience living here... (optional)"
        className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none h-24 mb-4"
      />

      <button
        onClick={handleSubmit}
        disabled={rating === 0}
        className="bg-primary-blue text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {existingReview ? 'Update Review' : 'Submit Review'}
      </button>
    </div>
  );
}
```

---

## 5. Date Formatting Helper

Use relative dates for recent reviews, full dates for older ones:

```ts
// src/lib/utils.ts
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }

  return date.toLocaleDateString('en-CA', { year: 'numeric', month: 'long' });
}
```

---

## 6. Clean Up Profile / Display Name References

Since reviews are now anonymous:

- Remove `display_name` from being fetched in review queries (it's no longer displayed)
- The `profiles` table still has `display_name` — keep it for the navbar user menu, just don't use it in reviews
- Remove any joins to `profiles` in review SELECT queries (only need `reviews.*` now)

```ts
// BEFORE:
const { data: reviews } = await supabase
  .from('reviews')
  .select('*, profiles(display_name, avatar_url)')
  .eq('listing_id', id);

// AFTER:
const { data: reviews } = await supabase
  .from('reviews')
  .select('*')
  .eq('listing_id', id)
  .order('created_at', { ascending: false });
```

---

## 7. Avatar Image Specs

When saving avatar images to `/public/images/avatars/`:
- Size: **80x80px** (they display at 40x40, so 2x for retina)
- Format: PNG with transparent background
- Style: fun, colorful, simple icons (fruits, animals, objects)
- Name them: `avatar-1.png`, `avatar-2.png`, ... `avatar-10.png`

Update the `AVATAR_COUNT` constant in `utils.ts` to match however many images you end up adding.

---

## Summary

| Change | What |
|--------|------|
| Remove display name input | ReviewForm — no longer asks for a name |
| Remove display name display | ReviewCard — no name shown |
| Add avatar_icon column | `reviews` table (and `university_reviews` if applicable) |
| Random avatar assignment | Randomly pick from `/images/avatars/avatar-{n}.png` on first review, keep on edit |
| New ReviewCard layout | Avatar left, stars + comment + date stacked right |
| Relative date formatting | "2 months ago" instead of "March 10, 2026" |
| Remove profiles join | Review queries no longer need to join profiles table |
