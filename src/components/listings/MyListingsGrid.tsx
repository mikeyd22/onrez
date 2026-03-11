"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Listing } from "@/types";
import { ListingCard } from "./ListingCard";
import { Button } from "@/components/ui/button";

interface MyListingsGridProps {
  listings: Listing[];
}

export function MyListingsGrid({ listings }: MyListingsGridProps) {
  const router = useRouter();

  async function handleDelete(listingId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this listing? It will no longer be visible to others."
    );
    if (!confirmed) return;

    const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete listing.");
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {listings.map((listing) => (
        <div key={listing.id} className="rounded-xl bg-white shadow-sm border border-border overflow-hidden flex flex-col">
          <div>
            <ListingCard listing={listing} />
          </div>
          <div className="p-3 flex gap-2 border-t border-border">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              asChild
            >
              <Link href={`/listing/${listing.id}/edit`}>Edit</Link>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 flex-1"
              onClick={() => handleDelete(listing.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
