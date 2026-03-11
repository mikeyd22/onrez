"use client";

import { useRouter } from "next/navigation";
import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import type { Review } from "@/types";

interface ReviewSectionProps {
  reviews: Review[];
  listingId: string;
  userReview: Review | null;
  isLoggedIn: boolean;
  isAdmin?: boolean;
}

export function ReviewSection({
  reviews,
  listingId,
  userReview,
  isLoggedIn,
  isAdmin = false,
}: ReviewSectionProps) {
  const router = useRouter();

  async function handleDeleteReview(reviewId: string) {
    const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <>
      <div className="space-y-0">
        {reviews.map((review) => (
          <div key={review.id} className="relative group">
            <ReviewCard review={review} />
            {(userReview?.id === review.id || isAdmin) && (
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleDeleteReview(review.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <div id="review-form" className="mt-8">
        <ReviewForm
          listingId={listingId}
          existingReview={userReview}
          isLoggedIn={isLoggedIn}
          onReviewSubmitted={() => router.refresh()}
        />
      </div>
    </>
  );
}
