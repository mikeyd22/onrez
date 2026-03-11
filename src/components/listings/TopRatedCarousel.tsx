"use client";

import { useRef } from "react";
import Link from "next/link";
import { ListingCard } from "./ListingCard";
import type { Listing } from "@/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TopRatedCarouselProps {
  listings: Listing[];
}

export function TopRatedCarousel({ listings: topRated }: TopRatedCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 340;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900">
          Top Rated Listings
        </h2>
        <Link
          href="/explore"
          className="text-sm font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      <p className="text-gray-500 mb-8">
        Highest-rated rentals from verified students
      </p>
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide"
        >
          {topRated.map((listing) => (
            <div
              key={listing.id}
              className="snap-start shrink-0"
            >
              <ListingCard
                listing={listing}
                variant="carousel"
                isLoggedIn={false}
                initialBookmarked={false}
              />
            </div>
          ))}
        </div>
        <div className="hidden lg:flex absolute top-1/2 -translate-y-1/2 left-0 right-0 justify-between pointer-events-none px-1">
          <button
            type="button"
            aria-label="Scroll left"
            className="pointer-events-auto w-10 h-10 rounded-full bg-white shadow-md border border-border flex items-center justify-center text-medium-text hover:bg-gray-50 transition-all"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            className="pointer-events-auto w-10 h-10 rounded-full bg-white shadow-md border border-border flex items-center justify-center text-medium-text hover:bg-gray-50 transition-all"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}
