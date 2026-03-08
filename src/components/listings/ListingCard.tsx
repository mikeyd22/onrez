import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/types";
import { formatPrice } from "@/lib/utils";
import { StarRating } from "./StarRating";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  listing: Listing;
  compact?: boolean;
  className?: string;
}

export function ListingCard({
  listing,
  compact = false,
  className,
}: ListingCardProps) {
  const imageUrl = listing.images[0] ?? `https://placehold.co/600x400/E2E8F0/64748B?text=Photo`;

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
        <Image
          src={imageUrl}
          alt={listing.address}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
          sizes={compact ? "96px" : "(max-width: 768px) 100vw, 400px"}
          unoptimized
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
        <div className="mt-2">
          <StarRating
            rating={listing.avgRating ?? 0}
            reviewCount={listing.reviewCount ?? 0}
            size="sm"
          />
        </div>
        {!compact && (
          <span className="inline-block mt-2 text-xs font-medium text-medium-text bg-gray-100 px-2 py-0.5 rounded">
            {listing.propertyType}
          </span>
        )}
      </div>
    </Link>
  );
}
