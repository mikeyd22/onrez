"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ListingOwnerActionsProps {
  listingId: string;
}

export function ListingOwnerActions({ listingId }: ListingOwnerActionsProps) {
  const router = useRouter();

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to remove this listing? It will no longer be visible to others."
    );
    if (!confirmed) return;

    const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/my-listings");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Failed to delete listing.");
    }
  }

  return (
    <div className="flex gap-3 mt-4">
      <Button variant="outline" asChild>
        <Link href={`/listing/${listingId}/edit`}>Edit Listing</Link>
      </Button>
      <Button
        variant="outline"
        className="text-red-600 hover:bg-red-50 hover:text-red-700"
        onClick={handleDelete}
      >
        Delete Listing
      </Button>
    </div>
  );
}
