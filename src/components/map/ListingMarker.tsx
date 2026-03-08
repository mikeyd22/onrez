"use client";

import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/types";
import { formatPrice } from "@/lib/utils";
import { StarRatingDisplay } from "@/components/listings/StarRatingDisplay";
import { cn } from "@/lib/utils";

interface ListingMarkerProps {
  price: number;
  selected: boolean;
  listing: Listing;
}

export function ListingMarker({ price, selected, listing }: ListingMarkerProps) {
  return (
    <div className="relative group">
      <div
        className={cn(
          "px-2.5 py-1 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer",
          selected
            ? "bg-primary text-white shadow-lg scale-110"
            : "bg-gray-900 text-white hover:bg-primary hover:scale-105"
        )}
      >
        {formatPrice(price)}
      </div>
      {selected && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-white rounded-xl shadow-lg border border-border overflow-hidden z-50">
          <div className="relative h-28 w-full bg-gray-100">
            <Image
              src={listing.images[0] ?? "https://placehold.co/400x200"}
              alt={listing.address}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="p-3">
            <p className="font-semibold text-dark-text text-sm truncate">
              {listing.address}
            </p>
            <p className="text-sm font-bold text-dark-text mt-0.5">
              {formatPrice(listing.pricePerMonth)}/mo
            </p>
            <div className="flex items-center gap-1 mt-1">
              <StarRatingDisplay rating={listing.avgRating ?? 0} size="sm" />
              <span className="text-xs text-medium-text ml-1">
                {listing.reviewCount ?? 0} reviews
              </span>
            </div>
            <Link
              href={`/listing/${listing.id}`}
              className="mt-2 block text-center text-sm font-medium text-primary hover:underline"
            >
              View listing →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
