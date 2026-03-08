import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
  className?: string;
}

export function StarRating({
  rating,
  reviewCount,
  size = "md",
  className,
}: StarRatingProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const value = Math.min(5, Math.max(0, rating));

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={
              i <= Math.floor(value)
                ? cn(iconSize, "fill-star-yellow text-star-yellow")
                : cn(iconSize, "text-gray-200")
            }
          />
        ))}
      </div>
      <span className="text-sm text-medium-text ml-0.5">
        {reviewCount ?? 0} review{(reviewCount ?? 0) !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
