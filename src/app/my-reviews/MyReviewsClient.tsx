"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { MyReviewCard } from "@/components/reviews/MyReviewCard";
import type { MyReviewItem } from "./page";

interface MyReviewsClientProps {
  reviews: MyReviewItem[];
}

export function MyReviewsClient({ reviews }: MyReviewsClientProps) {
  const router = useRouter();
  const [localReviews, setLocalReviews] = useState(reviews);

  async function handleDelete(reviewId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );
    if (!confirmed) return;

    const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
    if (res.ok) {
      setLocalReviews((prev) => prev.filter((r) => r.id !== reviewId));
      router.refresh();
    }
  }

  if (localReviews.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="mb-2">You haven&apos;t left any reviews yet.</p>
        <p className="text-sm">
          Browse listings and share your experience to help other students.
        </p>
        <Link
          href="/explore"
          className="inline-block mt-4 bg-primary text-white px-5 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Explore Listings
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {localReviews.map((review) => (
        <MyReviewCard
          key={review.id}
          review={review}
          onUpdate={() => router.refresh()}
          onDelete={() => handleDelete(review.id)}
        />
      ))}
    </div>
  );
}
