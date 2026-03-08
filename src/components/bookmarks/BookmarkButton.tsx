"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  listingId: string;
  initialBookmarked: boolean;
  isLoggedIn: boolean;
  className?: string;
}

export function BookmarkButton({
  listingId,
  initialBookmarked,
  isLoggedIn,
  className,
}: BookmarkButtonProps) {
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);

  async function toggleBookmark() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId }),
      });
      const data = await res.json();
      setBookmarked(data.bookmarked ?? false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleBookmark}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors",
        bookmarked ? "bg-red-50 text-red-600 border-red-200" : "bg-white text-medium-text hover:bg-gray-50",
        className
      )}
      aria-label={bookmarked ? "Remove bookmark" : "Save bookmark"}
    >
      <Heart
        className={cn("h-5 w-5", bookmarked && "fill-current")}
      />
      {bookmarked ? "Saved" : "Save"}
    </button>
  );
}
