import type { Listing } from "@/types";
import { ListingCard } from "./ListingCard";
import { cn } from "@/lib/utils";

interface ListingGridProps {
  listings: Listing[];
  className?: string;
}

export function ListingGrid({ listings, className }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="rounded-xl bg-white border border-border p-12 text-center text-medium-text">
        No listings match your filters. Try adjusting your search or filters.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        className
      )}
    >
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
