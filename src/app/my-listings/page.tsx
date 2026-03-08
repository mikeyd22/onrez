import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listingRowToApi } from "@/lib/api-transform";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { Button } from "@/components/ui/button";

export default async function MyListingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: rows } = await supabase
    .from("listings")
    .select("*, listing_photos(*), universities(slug)")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (rows ?? []).map((r: unknown) =>
    listingRowToApi(r as Parameters<typeof listingRowToApi>[0])
  );

  return (
    <div className="min-h-screen bg-light-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-dark-text">My Listings</h1>
          <Button asChild style={{ backgroundColor: "#3B5BDB" }}>
            <Link href="/listing/new">Post a new listing</Link>
          </Button>
        </div>
        <p className="mt-2 text-medium-text">
          {listings.length === 0
            ? "You haven't posted any listings yet."
            : `${listings.length} listing${listings.length !== 1 ? "s" : ""}`}
        </p>
        <div className="mt-6">
          {listings.length === 0 ? (
            <div className="rounded-xl border border-border bg-white p-12 text-center">
              <p className="text-medium-text mb-4">No listings yet.</p>
              <Button asChild>
                <Link href="/listing/new">Post your first listing</Link>
              </Button>
            </div>
          ) : (
            <ListingGrid listings={listings} />
          )}
        </div>
      </div>
    </div>
  );
}
