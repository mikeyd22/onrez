import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { universityRowToApi, listingRowToApi, universityReviewRowToApi } from "@/lib/api-transform";
import type { Listing, UniversityReview } from "@/types";
import { UniversityHero } from "@/components/university/UniversityHero";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { UniversityReviewSection } from "@/components/university/UniversityReviewSection";
import { formatPrice } from "@/lib/utils";
import { UniversityMapSection } from "@/components/university/UniversityMapSection";
import { StarRatingDisplay } from "@/components/listings/StarRatingDisplay";

const INITIAL_LISTINGS = 12;

export default async function UniversityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: uniRow } = await supabase
    .from("universities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!uniRow) notFound();

  const { data: listingRows } = await supabase.rpc("listings_near_university", {
    uni_lat: uniRow.latitude,
    uni_lng: uniRow.longitude,
    radius_meters: 5000,
  });

  const listingIds = (listingRows ?? []).map((r: { id: string }) => r.id);
  const { data: photos } = await supabase
    .from("listing_photos")
    .select("*")
    .in("listing_id", listingIds.length ? listingIds : ["00000000-0000-0000-0000-000000000000"])
    .order("display_order");

  const photosByListingId = new Map<string, { id: string; listing_id: string; url: string; display_order: number; alt_text: string | null; created_at: string }[]>();
  (photos ?? []).forEach((p: { listing_id: string; id: string; url: string; display_order: number; alt_text?: string | null; created_at?: string }) => {
    const list = photosByListingId.get(p.listing_id) ?? [];
    list.push({
      id: p.id,
      listing_id: p.listing_id,
      url: p.url,
      display_order: p.display_order,
      alt_text: p.alt_text ?? null,
      created_at: p.created_at ?? new Date().toISOString(),
    });
    photosByListingId.set(p.listing_id, list);
  });

  const allListings = (listingRows ?? []).map((r: unknown) => {
    const row = r as Parameters<typeof listingRowToApi>[0] & { id: string };
    const listingPhotos = (photosByListingId.get(row.id) ?? []).sort((a, b) => a.display_order - b.display_order);
    return listingRowToApi({
      ...row,
      listing_photos: listingPhotos,
      universities: { slug: uniRow.slug },
    });
  });

  const initialListings = allListings.slice(0, INITIAL_LISTINGS);
  const hasMore = allListings.length > INITIAL_LISTINGS;

  const avgRent =
    allListings.length > 0
      ? Math.round(allListings.reduce((sum: number, l: Listing) => sum + l.pricePerMonth, 0) / allListings.length)
      : 0;
  const avgRating =
    allListings.length > 0
      ? (allListings.reduce((sum: number, l: Listing) => sum + (l.avgRating ?? 0), 0) / allListings.length).toFixed(1)
      : "0";

  const university = universityRowToApi({
    ...uniRow,
    listing_count: allListings.length,
    avg_rent: avgRent,
  });

  const { data: reviewRows } = await supabase
    .from("university_reviews")
    .select("*, profiles(display_name, email, avatar_url)")
    .eq("university_id", uniRow.id)
    .order("created_at", { ascending: false });

  const universityReviews = (reviewRows ?? []).map((r: unknown) =>
    universityReviewRowToApi(r as Parameters<typeof universityReviewRowToApi>[0])
  ) as UniversityReview[];

  const { data: { user } } = await supabase.auth.getUser();
  const userReviewRow = user
    ? (reviewRows ?? []).find((r: { user_id: string }) => r.user_id === user.id)
    : null;
  const userUniversityReview = userReviewRow
    ? universityReviewRowToApi(userReviewRow as Parameters<typeof universityReviewRowToApi>[0])
    : null;

  return (
    <div className="min-h-screen bg-light-bg">
      <UniversityHero university={university} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 -mt-4 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-border p-5">
            <p className="text-sm text-medium-text">Average Rent</p>
            <p className="text-2xl font-bold text-dark-text mt-1">
              {formatPrice(avgRent)}/mo
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-border p-5">
            <p className="text-sm text-medium-text">Listings</p>
            <p className="text-2xl font-bold text-dark-text mt-1">
              {allListings.length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-border p-5">
            <p className="text-sm text-medium-text">Avg Rating</p>
            <p className="text-2xl font-bold text-dark-text mt-1 flex items-center gap-1">
              <StarRatingDisplay rating={Number(avgRating)} size="md" />
              <span>{avgRating} ★</span>
            </p>
          </div>
        </div>

        <UniversityMapSection university={university} listings={initialListings} />

        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-semibold text-dark-text">
              Listings near {university.name}
            </h2>
            <Link
              href={user ? `/listing/new?university=${slug}` : `/auth/login?redirect=/university/${slug}`}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              + Add Your Listing
            </Link>
          </div>
          <div className="mt-6">
            <ListingGrid listings={initialListings} />
          </div>
          {hasMore && (
            <p className="mt-6 text-center text-medium-text">
              Showing first {INITIAL_LISTINGS} of {allListings.length}.{" "}
              <Link href="/explore" className="text-primary font-medium hover:underline">
                Explore all listings
              </Link>
            </p>
          )}
        </section>

        <UniversityReviewSection
          universitySlug={slug}
          universityName={university.name}
          reviews={universityReviews}
          userReview={userUniversityReview}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}
