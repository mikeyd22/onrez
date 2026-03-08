import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Simpler star display: just show filled stars up to rating, rest empty */
export function StarRatingDisplay({
  rating,
  max = 5,
  size = "md",
  className,
}: {
  rating: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={
            i < Math.floor(rating)
              ? cn(iconSize, "fill-star-yellow text-star-yellow")
              : cn(iconSize, "text-gray-200")
          }
        />
      ))}
    </div>
  );
}
