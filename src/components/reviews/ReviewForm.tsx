"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Review } from "@/types";

interface ReviewFormProps {
  listingId: string;
  existingReview: Review | null;
  isLoggedIn: boolean;
  onReviewSubmitted?: () => void;
}

export function ReviewForm({
  listingId,
  existingReview,
  isLoggedIn,
  onReviewSubmitted,
}: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRating(existingReview?.rating ?? 0);
    setComment(existingReview?.comment ?? "");
  }, [existingReview]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, rating, comment }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onReviewSubmitted?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
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
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg mb-4">{error}</p>
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
          <label htmlFor="review-comment" className="text-sm font-medium text-dark-text block mb-2">
            Your review
          </label>
          <Textarea
            id="review-comment"
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {existingReview ? "Update Review" : "Submit Review"}
        </Button>
      </div>
    </form>
  );
}
