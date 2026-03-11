import Link from "next/link";
import { Star } from "lucide-react";
import type { Listing } from "@/types";
import { formatPrice, pluralize } from "@/lib/utils";
import { StarRating } from "./StarRating";
import { BookmarkButton } from "@/components/bookmarks/BookmarkButton";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  listing: Listing;
  compact?: boolean;
  /** Carousel/top-rated variant: price on photo, bookmark button, fixed height */
  variant?: "default" | "carousel";
  /** For carousel: show bookmark; pass from carousel if user is logged in */
  isLoggedIn?: boolean;
  initialBookmarked?: boolean;
  className?: string;
}

export function ListingCard({
  listing,
  compact = false,
  variant = "default",
  isLoggedIn = false,
  initialBookmarked = false,
  className,
}: ListingCardProps) {
  const imageUrl = listing.images[0] ?? "/images/placeholder-listing.jpg";
  const isCarousel = variant === "carousel";

  if (isCarousel) {
    return (
      <Link
        href={`/listing/${listing.id}`}
        className={cn(
          "group block min-w-[280px] max-w-[300px] flex-shrink-0",
          className
        )}
      >
        <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          <div className="relative h-44 w-full overflow-hidden bg-gray-100">
            <img
              src={imageUrl}
              alt={listing.address}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <span className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm text-sm font-bold px-3 py-1.5 rounded-lg shadow-sm text-gray-900">
              {formatPrice(listing.pricePerMonth)}/mo
            </span>
            <div
              className="absolute top-3 right-3 z-10"
              onClick={(e) => e.preventDefault()}
            >
              <BookmarkButton
                listingId={listing.id}
                initialBookmarked={initialBookmarked}
                isLoggedIn={isLoggedIn}
                iconOnly
              />
            </div>
          </div>
          <div className="bg-white p-4">
            <h3 className="font-medium text-gray-900 truncate">{listing.address}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{listing.city}</p>
            {(listing.reviewCount ?? 0) > 0 ? (
              <div className="flex items-center gap-1 mt-2">
                <Star className="w-4 h-4 fill-star-yellow text-star-yellow" />
                <span className="text-sm font-medium">
                  {(listing.avgRating ?? 0).toFixed(1)}
                </span>
                <span className="text-sm text-gray-400">
                  ({listing.reviewCount ?? 0} {pluralize(listing.reviewCount ?? 0, "review")})
                </span>
              </div>
            ) : (
              <span className="inline-block mt-2 text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                New
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/listing/${listing.id}`}
      className={cn(
        "group block rounded-xl bg-white shadow-sm transition-all duration-200 hover:shadow-md overflow-hidden",
        compact ? "flex gap-3 p-3" : "",
        className
      )}
    >
      <div
        className={cn(
          "relative bg-gray-100 overflow-hidden",
          compact
            ? "h-20 w-24 shrink-0 rounded-lg"
            : "aspect-[16/10] w-full rounded-t-xl"
        )}
      >
        <img
          src={imageUrl}
          alt={listing.address}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
      </div>
      <div className={compact ? "flex-1 min-w-0 flex flex-col justify-center" : "p-5"}>
        <p className="font-semibold text-dark-text text-base truncate">
          {listing.address}
        </p>
        <p className="text-sm text-medium-text mt-0.5">
          {listing.city}
        </p>
        <p className={compact ? "text-sm text-medium-text mt-0.5" : "font-bold text-dark-text text-base mt-0.5"}>
          {formatPrice(listing.pricePerMonth)}/mo
        </p>
        {(listing.reviewCount ?? 0) > 0 ? (
          <div className="mt-2">
            <StarRating
              rating={listing.avgRating ?? 0}
              reviewCount={listing.reviewCount ?? 0}
              size="sm"
            />
          </div>
        ) : (
          <span className="inline-block mt-2 text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
            New
          </span>
        )}
        {!compact && (
          <span className="inline-block mt-2 text-xs font-medium text-medium-text bg-gray-100 px-2 py-0.5 rounded">
            {listing.propertyType}
          </span>
        )}
      </div>
    </Link>
  );
}
