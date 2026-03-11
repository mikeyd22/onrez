"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { ReviewForm } from "./ReviewForm";
import type { MyReviewItem } from "@/app/my-reviews/page";
import { cn } from "@/lib/utils";

interface MyReviewCardProps {
  review: MyReviewItem;
  onUpdate: () => void;
  onDelete: () => void;
}

const COMMENT_PREVIEW_LINES = 2;

export function MyReviewCard({ review, onUpdate, onDelete }: MyReviewCardProps) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const listing = review.listings;
  const comment = review.comment ?? "";
  const lineCount = comment.split("\n").length;
  const showExpand = lineCount > COMMENT_PREVIEW_LINES && !expanded;
  const displayComment = showExpand
    ? comment.split("\n").slice(0, COMMENT_PREVIEW_LINES).join("\n") + "..."
    : comment;

  if (!listing) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Link
            href={`/listing/${listing.id}`}
            className="font-medium text-gray-900 hover:text-primary transition-colors"
          >
            {listing.address}, {listing.city ?? ""}
          </Link>
          <p className="text-sm text-gray-500 mt-0.5">
            {listing.universities?.name ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "w-4 h-4",
                star <= review.rating
                  ? "fill-star-yellow text-star-yellow"
                  : "fill-gray-200 text-gray-200"
              )}
            />
          ))}
        </div>
      </div>

      {!editing && comment && (
        <p className="text-sm text-medium-text leading-relaxed mb-2">
          {displayComment}
          {showExpand && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-primary hover:underline ml-1 text-sm"
            >
              Show more
            </button>
          )}
        </p>
      )}

      {!editing && review.reviewPhotos && review.reviewPhotos.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {review.reviewPhotos.map((photo) => (
            <img
              key={photo.id}
              src={photo.url}
              alt=""
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
          ))}
        </div>
      )}

      {editing && (
        <ReviewForm
          listingId={listing.id}
          existingReview={review}
          isLoggedIn
          onReviewSubmitted={() => {
            setEditing(false);
            onUpdate();
          }}
          onCancel={() => setEditing(false)}
        />
      )}

      {!editing && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">
            {formatRelativeDate(review.createdAt)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-sm text-gray-600 hover:text-primary transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
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
