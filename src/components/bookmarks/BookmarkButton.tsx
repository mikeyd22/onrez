"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  listingId: string;
  initialBookmarked: boolean;
  isLoggedIn: boolean;
  /** Compact icon-only for cards (e.g. listing carousel) */
  iconOnly?: boolean;
  className?: string;
}

export function BookmarkButton({
  listingId,
  initialBookmarked,
  isLoggedIn,
  iconOnly = false,
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
        "flex items-center justify-center rounded-lg border border-border text-sm font-medium transition-colors",
        iconOnly
          ? "p-2 border-0 bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm"
          : "gap-2 px-4 py-2",
        bookmarked ? "bg-red-50 text-red-600 border-red-200" : "bg-white text-medium-text hover:bg-gray-50",
        iconOnly && bookmarked && "!bg-red-50 !text-red-600",
        className
      )}
      aria-label={bookmarked ? "Remove bookmark" : "Save bookmark"}
    >
      <Heart
        className={cn(iconOnly ? "h-5 w-5" : "h-5 w-5", bookmarked && "fill-current")}
      />
      {!iconOnly && (bookmarked ? "Saved" : "Save")}
    </button>
  );
}
