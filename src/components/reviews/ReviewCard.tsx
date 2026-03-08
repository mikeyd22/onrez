import Image from "next/image";
import type { Review } from "@/types";
import { formatDate } from "@/lib/utils";
import { StarRatingDisplay } from "@/components/listings/StarRatingDisplay";
import { cn } from "@/lib/utils";

interface ReviewCardProps {
  review: Review;
  className?: string;
}

export function ReviewCard({ review, className }: ReviewCardProps) {
  return (
    <div
      className={cn(
        "flex gap-4 rounded-xl border border-border bg-white p-5",
        className
      )}
    >
      <Image
        src={review.avatarUrl}
        alt={review.userName}
        width={40}
        height={40}
        className="rounded-full shrink-0"
        unoptimized
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-dark-text">{review.userName}</span>
          <span className="text-sm text-medium-text">
            {formatDate(review.createdAt)}
          </span>
        </div>
        <div className="mt-1">
          <StarRatingDisplay rating={review.rating} size="sm" />
        </div>
        <p className="mt-2 text-medium-text leading-relaxed">
          {review.comment}
        </p>
      </div>
    </div>
  );
}
