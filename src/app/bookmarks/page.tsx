import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listingRowToApi } from "@/lib/api-transform";
import { ListingGrid } from "@/components/listings/ListingGrid";

export default async function BookmarksPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: bookmarkRows } = await supabase
    .from("bookmarks")
    .select("*, listings(*, listing_photos(*), review_photos(*), universities(slug))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (bookmarkRows ?? [])
    .map((b: { listings: unknown }) => b.listings)
    .filter(Boolean)
    .map((r: unknown) => listingRowToApi(r as Parameters<typeof listingRowToApi>[0]));

  const bookmarkedIds = new Set(listings.map((l) => l.id));

  return (
    <div className="min-h-screen bg-light-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-dark-text">Saved Listings</h1>
        <p className="mt-2 text-medium-text">
          {listings.length === 0
            ? "You haven't saved any listings yet. Browse listings to save your favorites."
            : `${listings.length} saved listing${listings.length !== 1 ? "s" : ""}`}
        </p>
        <div className="mt-6">
          <ListingGrid listings={listings} />
        </div>
      </div>
    </div>
  );
}
