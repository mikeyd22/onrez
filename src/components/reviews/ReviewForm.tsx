"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Star, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn, getRandomAvatar } from "@/lib/utils";
import type { Review, ReviewPhoto } from "@/types";

const MAX_PHOTOS = 10;

interface ReviewFormProps {
  listingId: string;
  existingReview: (Review & { reviewPhotos?: ReviewPhoto[] }) | null;
  isLoggedIn: boolean;
  onReviewSubmitted?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  listingId,
  existingReview,
  isLoggedIn,
  onReviewSubmitted,
  onCancel,
}: ReviewFormProps) {
  const router = useRouter();
  const justSubmittedRef = useRef(false);
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [photos, setPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ReviewPhoto[]>(
    existingReview?.reviewPhotos ?? []
  );
  const [photosToDelete, setPhotosToDelete] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (justSubmittedRef.current) {
      setRating(0);
      setComment("");
      setPhotos([]);
      setExistingPhotos([]);
      setPhotosToDelete([]);
      justSubmittedRef.current = false;
    } else {
      setRating(existingReview?.rating ?? 0);
      setComment(existingReview?.comment ?? "");
      setExistingPhotos(existingReview?.reviewPhotos ?? []);
    }
  }, [existingReview]);

  const keptExisting = existingPhotos.filter((p) => !photosToDelete.includes(p.id));
  const totalPhotos = photos.length + keptExisting.length;

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_PHOTOS - totalPhotos;
    setPhotos((prev) => [...prev, ...files.slice(0, remaining)]);
    e.target.value = "";
  }

  function removeNewPhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function markExistingPhotoForDeletion(photoId: string) {
    setPhotosToDelete((prev) => [...prev, photoId]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const avatarIcon = existingReview?.avatarIcon ?? getRandomAvatar();
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          rating,
          comment,
          avatar_icon: avatarIcon,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const reviewId = data.id as string;

      for (const photoId of photosToDelete) {
        await supabase.from("review_photos").delete().eq("id", photoId);
      }

      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];
        const filePath = `reviews/${user.id}/${reviewId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("listing-photos")
          .upload(filePath, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("listing-photos")
            .getPublicUrl(filePath);
          await supabase.from("review_photos").insert({
            review_id: reviewId,
            listing_id: listingId,
            user_id: user.id,
            url: publicUrl,
            display_order: keptExisting.length + i,
          });
        }
      }

      justSubmittedRef.current = true;
      setRating(0);
      setComment("");
      setPhotos([]);
      setHover(0);
      onReviewSubmitted?.();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit review"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-border bg-white p-6">
        <p className="text-sm text-medium-text mb-4">
          Log in to leave a review
        </p>
        <Button asChild>
          <a href="/auth/login">Log in</a>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-white p-6">
      <h3 className="text-lg font-semibold text-dark-text mb-4">
        {existingReview ? "Edit your review" : "Write a review"}
      </h3>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg mb-4">
          {error}
        </p>
      )}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-dark-text mb-2">Your rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                className="p-1"
                onClick={() => setRating(i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${i} stars`}
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    (hover || rating) >= i
                      ? "fill-star-yellow text-star-yellow"
                      : "text-gray-200"
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <div>
          <label
            htmlFor="review-comment"
            className="text-sm font-medium text-dark-text block mb-2"
          >
            Your review
          </label>
          <Textarea
            id="review-comment"
            placeholder="Share your experience... (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-dark-text mb-2 block">
            Add photos (optional, max {MAX_PHOTOS})
          </label>
          {keptExisting.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {keptExisting.map((photo) => (
                <div key={photo.id} className="relative w-20 h-20">
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => markExistingPhotoForDeletion(photo.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {photos.length > 0 && (
            <div className="flex gap-2 mb-3 flex-wrap">
              {photos.map((file, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="w-full h-full rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewPhoto(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {totalPhotos < MAX_PHOTOS && (
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
              <Camera className="w-4 h-4" />
              Add photos ({totalPhotos}/{MAX_PHOTOS})
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

        <div className="flex gap-3">
          <Button type="submit" disabled={rating === 0 || loading}>
            {loading
              ? "Saving..."
              : existingReview
                ? "Update Review"
                : "Submit Review"}
          </Button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
