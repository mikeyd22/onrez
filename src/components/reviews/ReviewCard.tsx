"use client";

import { useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { PhotoLightbox } from "./PhotoLightbox";
import { cn } from "@/lib/utils";
import type { Review } from "@/types";

interface ReviewCardProps {
  review: Review;
  className?: string;
}

export function ReviewCard({ review, className }: ReviewCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const photos = review.reviewPhotos ?? [];

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  return (
    <div
      className={cn(
        "flex gap-4 py-5 border-b border-gray-100 last:border-none",
        className
      )}
    >
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
          <Image
            src={review.avatarIcon || "/images/avatars/avatar-1.png"}
            alt="Reviewer"
            width={40}
            height={40}
            className="w-full h-full object-cover"
            unoptimized
          />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1.5">
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
        {review.comment && (
          <p className="text-sm text-medium-text leading-relaxed mb-2">
            {review.comment}
          </p>
        )}
        {photos.length > 0 && (
          <div className="flex gap-2 mt-3">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => openLightbox(i)}
                className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 hover:opacity-90 transition-opacity"
              >
                <img
                  src={photo.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-medium-text/80 mt-2">
          {formatRelativeDate(review.createdAt)}
        </p>
      </div>
      {lightboxOpen && (
        <PhotoLightbox
          photos={photos.map((p) => ({ id: p.id, url: p.url }))}
          startIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
