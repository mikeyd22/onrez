# OnRez — My Reviews Page + Review Photos

## Overview

Two new features:
1. A "My Reviews" page where users can see, edit, and delete all reviews they've left
2. Allow users to attach photos when leaving a review — these photos become the listing's gallery

---

## 1. My Reviews Page (`/my-reviews`)

### Page Layout

```
My Reviews
──────────────────────────────────────────────────
You've left 8 reviews

┌──────────────────────────────────────────────┐
│  256 Lester St, Waterloo          ★★★★☆      │
│  University of Waterloo                      │
│  "Great place, close to campus and very..."  │
│  3 months ago                [Edit] [Delete] │
├──────────────────────────────────────────────┤
│  330 Columbia St W, Waterloo      ★★★☆☆      │
│  University of Waterloo                      │
│  "Decent but landlord is slow to fix..."     │
│  5 months ago                [Edit] [Delete] │
└──────────────────────────────────────────────┘
```

### Server Component

```tsx
// src/app/my-reviews/page.tsx
export default async function MyReviewsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Fetch all reviews by this user, with the listing info
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, listings(id, address, city, university_id, universities(name, slug)), review_photos(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return <MyReviewsClient reviews={reviews || []} />;
}
```

### Review Card on This Page

Each review card shows:
- Listing address (clickable link to `/listing/[id]`)
- University name
- Star rating
- Comment text (truncated to 2 lines with "Show more" expand)
- Photo thumbnails (small row, if any)
- Relative date
- **Edit** button — opens an inline edit form (same ReviewForm component, pre-filled)
- **Delete** button — confirmation dialog, then deletes

```tsx
function MyReviewCard({ review, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      {/* Header: listing info + rating */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <Link
            href={`/listing/${review.listings.id}`}
            className="font-medium text-gray-900 hover:text-primary-blue transition-colors"
          >
            {review.listings.address}, {review.listings.city}
          </Link>
          <p className="text-sm text-gray-500 mt-0.5">
            {review.listings.universities?.name}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "w-4 h-4",
                star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
              )}
            />
          ))}
        </div>
      </div>

      {/* Comment */}
      {!editing && review.comment && (
        <p className="text-sm text-gray-700 leading-relaxed mb-2">
          {review.comment}
        </p>
      )}

      {/* Photo thumbnails */}
      {!editing && review.review_photos?.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {review.review_photos.map((photo) => (
            <img
              key={photo.id}
              src={photo.url}
              alt=""
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          ))}
        </div>
      )}

      {/* Edit form (inline, shown when editing) */}
      {editing && (
        <ReviewForm
          listingId={review.listing_id}
          existingReview={review}
          onReviewSubmitted={() => { setEditing(false); onUpdate(); }}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* Footer: date + actions */}
      {!editing && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">{formatRelativeDate(review.created_at)}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-gray-600 hover:text-primary-blue transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(review.id)}
              className="text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Empty State

```tsx
{reviews.length === 0 && (
  <div className="text-center py-16 text-gray-500">
    <p className="mb-2">You haven't left any reviews yet.</p>
    <p className="text-sm">Browse listings and share your experience to help other students.</p>
    <Link href="/explore" className="inline-block mt-4 bg-primary-blue text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">
      Explore Listings
    </Link>
  </div>
)}
```

### Delete Handler

```tsx
async function handleDelete(reviewId: string) {
  const confirmed = window.confirm('Are you sure you want to delete this review?');
  if (!confirmed) return;

  const supabase = createClient();
  await supabase.from('review_photos').delete().eq('review_id', reviewId);
  await supabase.from('reviews').delete().eq('id', reviewId);
  router.refresh();
}
```

### Add to Navbar Dropdown

```
[Avatar] Michael ▾
  ├── My Bookmarks       → /bookmarks
  ├── My Reviews          → /my-reviews      ← NEW
  ├── My Listings         → /my-listings
  ├── Post a Listing      → /listing/new
  ├── ─────────────
  └── Log Out
```

---

## 2. Review Photos

### How It Works

When a user leaves a review on a listing, they can optionally upload up to **10 photos**. These photos:
- Are attached to the review (not the listing directly)
- Become the listing's photo gallery — the listing page pulls photos from all its reviews
- The **first photo ever uploaded** (from any review) becomes the listing's thumbnail on cards
- The **first 5 photos** (across all reviews, ordered by upload date) are shown as a collage on the listing detail page
- A "Show all photos" button opens a lightbox with every photo

### Database: Review Photos Table

```sql
CREATE TABLE review_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_photos_review ON review_photos(review_id);
CREATE INDEX idx_review_photos_listing ON review_photos(listing_id);

-- RLS
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review photos are viewable by everyone"
  ON review_photos FOR SELECT USING (true);

CREATE POLICY "Users can upload photos with their reviews"
  ON review_photos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review photos"
  ON review_photos FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all review photos"
  ON review_photos FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

### Storage

Use the existing `listing-photos` Supabase Storage bucket. Store review photos with the path:
```
reviews/{user_id}/{review_id}/{timestamp}_{filename}
```

### Updated Review Form — Photo Upload

Add a photo upload section to the ReviewForm:

```tsx
function ReviewForm({ listingId, existingReview, onReviewSubmitted, onCancel }: Props) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [photos, setPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState(existingReview?.review_photos || []);
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const totalPhotos = photos.length + existingPhotos.length - photosToDelete.length;
  const maxPhotos = 10;

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const remaining = maxPhotos - totalPhotos;
    setPhotos(prev => [...prev, ...files.slice(0, remaining)]);
  }

  function removeNewPhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  function markExistingPhotoForDeletion(photoId: string) {
    setPhotosToDelete(prev => [...prev, photoId]);
  }

  async function handleSubmit() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Upsert the review
    const avatarIcon = existingReview?.avatar_icon || getRandomAvatar();
    const { data: review, error } = await supabase
      .from('reviews')
      .upsert(
        {
          listing_id: listingId,
          user_id: user.id,
          rating,
          comment,
          avatar_icon: avatarIcon,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'listing_id,user_id' }
      )
      .select()
      .single();

    if (error || !review) {
      setLoading(false);
      return;
    }

    // 2. Delete photos marked for removal
    for (const photoId of photosToDelete) {
      await supabase.from('review_photos').delete().eq('id', photoId);
    }

    // 3. Upload new photos
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const filePath = `reviews/${user.id}/${review.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('listing-photos')
        .upload(filePath, file);

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('listing-photos')
          .getPublicUrl(filePath);

        await supabase.from('review_photos').insert({
          review_id: review.id,
          listing_id: listingId,
          user_id: user.id,
          url: publicUrl,
          display_order: existingPhotos.length + i,
        });
      }
    }

    onReviewSubmitted();
    setLoading(false);
  }

  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="font-semibold text-gray-900 mb-4">
        {existingReview ? 'Edit Your Review' : 'Leave a Review'}
      </h3>

      {/* Star selector */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} onClick={() => setRating(star)} className="focus:outline-none">
            <Star className={cn("w-7 h-7 cursor-pointer transition-colors",
              star <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200 hover:fill-yellow-200"
            )} />
          </button>
        ))}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience living here... (optional)"
        className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none h-24 mb-4"
      />

      {/* Photo upload section */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Add photos (optional, max {maxPhotos})
        </label>

        {/* Existing photo previews (when editing) */}
        {existingPhotos.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {existingPhotos
              .filter(p => !photosToDelete.includes(p.id))
              .map((photo) => (
                <div key={photo.id} className="relative w-20 h-20">
                  <img src={photo.url} alt="" className="w-full h-full rounded-lg object-cover" />
                  <button
                    onClick={() => markExistingPhotoForDeletion(photo.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
          </div>
        )}

        {/* New photo previews */}
        {photos.length > 0 && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {photos.map((file, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={URL.createObjectURL(file)} alt="" className="w-full h-full rounded-lg object-cover" />
                <button
                  onClick={() => removeNewPhoto(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        {totalPhotos < maxPhotos && (
          <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
            <Camera className="w-4 h-4" />
            Add photos ({totalPhotos}/{maxPhotos})
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={rating === 0 || loading}
          className="bg-primary-blue text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : existingReview ? 'Update Review' : 'Submit Review'}
        </button>
        {onCancel && (
          <button onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## 3. Listing Detail Page — Photo Gallery from Reviews

### How Photos Display

The listing detail page pulls ALL photos from all reviews on that listing and displays them as the listing's gallery.

**Fetch photos for a listing:**
```tsx
// In the listing detail server component:
const { data: allPhotos } = await supabase
  .from('review_photos')
  .select('*')
  .eq('listing_id', id)
  .order('created_at', { ascending: true });
```

### Collage Layout (First 5 Photos)

Show the first 5 photos in a collage grid at the top of the listing detail page:

```
┌───────────────────────┬─────────────┐
│                       │   Photo 2   │
│      Photo 1          ├─────────────┤
│    (large, ~60%)      │   Photo 3   │
│                       ├─────────────┤
│                       │   Photo 4   │
│                       ├─────────────┤
│                       │   Photo 5   │
└───────────────────────┴─────────────┘
                        [Show all photos (X)]
```

```tsx
function PhotoCollage({ photos }: { photos: ReviewPhoto[] }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const displayPhotos = photos.slice(0, 5);

  if (photos.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Camera className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No photos yet — leave a review to add some!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] rounded-xl overflow-hidden">
        {/* First photo — large, spans 2 columns and 2 rows */}
        <div className="col-span-2 row-span-2 relative">
          <img src={displayPhotos[0]?.url} alt="" className="w-full h-full object-cover" />
        </div>

        {/* Photos 2-5 — small grid on the right */}
        {displayPhotos.slice(1, 5).map((photo) => (
          <div key={photo.id} className="relative">
            <img src={photo.url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}

        {/* Fill empty slots if fewer than 5 photos */}
        {displayPhotos.length < 5 &&
          Array.from({ length: 5 - displayPhotos.length }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-gray-100" />
          ))
        }
      </div>

      {/* Show all photos button */}
      {photos.length > 0 && (
        <button
          onClick={() => setLightboxOpen(true)}
          className="mt-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Show all photos ({photos.length})
        </button>
      )}

      {/* Lightbox modal */}
      {lightboxOpen && (
        <PhotoLightbox photos={photos} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  );
}
```

### Listing Thumbnail (on Cards)

The thumbnail for listing cards (home page, explore page, university page, map popups) should be the **first photo ever uploaded** for that listing (earliest `created_at` in `review_photos`).

```tsx
// When fetching listings for cards, also get the first photo:
const { data: listings } = await supabase
  .from('listings')
  .select('*, review_photos(*)')
  .eq('is_active', true)
  .order('avg_rating', { ascending: false });

// In the ListingCard component, get thumbnail:
const thumbnail = listing.review_photos
  ?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  ?.[0]?.url || '/images/placeholder-listing.jpg';
```

Or create a database function for better performance:

```sql
CREATE OR REPLACE FUNCTION get_listing_thumbnail(p_listing_id UUID)
RETURNS TEXT AS $$
  SELECT url FROM review_photos
  WHERE listing_id = p_listing_id
  ORDER BY created_at ASC
  LIMIT 1;
$$ LANGUAGE sql STABLE;
```

### Review Card — Show Photo Thumbnails

In the ReviewCard component (on the listing detail page), show a small row of that review's photos:

```tsx
{/* Inside ReviewCard, after the comment text */}
{review.review_photos?.length > 0 && (
  <div className="flex gap-2 mt-3">
    {review.review_photos.map((photo) => (
      <img
        key={photo.id}
        src={photo.url}
        alt=""
        className="w-20 h-20 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => openLightbox(photo)}
      />
    ))}
  </div>
)}
```

---

## 4. Photo Lightbox Component

Create a full-screen lightbox for viewing all photos:

```tsx
function PhotoLightbox({ photos, onClose, startIndex = 0 }: Props) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 text-white/80 text-sm">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Main image */}
      <img
        src={photos[currentIndex].url}
        alt=""
        className="max-w-[90vw] max-h-[85vh] object-contain"
      />

      {/* Previous */}
      {currentIndex > 0 && (
        <button
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="absolute left-4 text-white/80 hover:text-white"
        >
          <ChevronLeft className="w-10 h-10" />
        </button>
      )}

      {/* Next */}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={() => setCurrentIndex(currentIndex + 1)}
          className="absolute right-4 text-white/80 hover:text-white"
        >
          <ChevronRight className="w-10 h-10" />
        </button>
      )}
    </div>
  );
}
```

---

## 5. Migrate Existing Listing Photos

If the app currently has a `listing_photos` table from the original design, keep both tables. On the listing detail page, combine both sources for the gallery:

```tsx
const allPhotos = [
  ...(listing.listing_photos || []),
  ...(reviewPhotos || [])
].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
```

The thumbnail logic should check both tables, preferring `listing_photos` first (owner photos), then `review_photos`.

---

## Summary

| Feature | Details |
|---------|---------|
| My Reviews page | `/my-reviews` — list all user's reviews with edit/delete |
| Add to navbar | "My Reviews" link in user dropdown menu |
| Review photos | Up to 10 photos per review, uploaded to Supabase Storage |
| Photo collage | First 5 photos shown as collage grid on listing detail |
| Show all photos | Lightbox modal to browse all photos |
| Listing thumbnail | First photo ever uploaded becomes the card thumbnail |
| Review card photos | Small thumbnail row under each review |
| Edit review photos | Can add/remove photos when editing a review |
| Empty state | "No photos yet" placeholder with camera icon |
