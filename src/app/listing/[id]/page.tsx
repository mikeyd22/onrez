import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listingRowToApi, reviewRowToApi } from "@/lib/api-transform";
import { ListingDetail } from "@/components/listings/ListingDetail";
import { StarRating } from "@/components/listings/StarRating";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import { BookmarkButton } from "@/components/bookmarks/BookmarkButton";

const ListingMap = dynamic(
  () =>
    import("@/components/listings/ListingMap").then((m) => ({
      default: m.ListingMap,
    })),
  { ssr: false }
);

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: listingRow } = await supabase
    .from("listings")
    .select("*, listing_photos(*), universities(name, slug)")
    .eq("id", id)
    .single();

  if (!listingRow) notFound();

  const { data: reviewPhotoRows } = await supabase
    .from("review_photos")
    .select("*")
    .eq("listing_id", id)
    .order("created_at", { ascending: true });

  const listing = listingRowToApi({
    ...(listingRow as Parameters<typeof listingRowToApi>[0]),
    review_photos: reviewPhotoRows ?? [],
  });
  const universityName = (listingRow as { universities?: { name: string } | null }).universities?.name ?? null;
  const ownerId = (listingRow as { owner_id: string | null }).owner_id ?? null;
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = !!(user && ownerId && user.id === ownerId);

  const listingPhotos = (listingRow as { listing_photos?: { id: string; url: string; display_order: number }[] }).listing_photos ?? [];
  const reviewPhotos = (reviewPhotoRows ?? []).map((p) => ({
    id: p.id,
    reviewId: p.review_id,
    listingId: p.listing_id,
    userId: p.user_id,
    url: p.url,
    displayOrder: p.display_order,
    createdAt: p.created_at,
  }));
  const sortedListingPhotos = [...listingPhotos].sort((a, b) => a.display_order - b.display_order);
  const sortedReviewPhotos = [...reviewPhotos].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const galleryPhotos = [
    ...sortedListingPhotos.map((p) => ({
      id: p.id,
      url: p.url,
      reviewId: "",
      listingId: id,
      userId: "",
      displayOrder: p.display_order,
      createdAt: "",
    })),
    ...sortedReviewPhotos,
  ];

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("*, review_photos(*)")
    .eq("listing_id", id)
    .order("created_at", { ascending: false });

  const reviews = (reviewRows ?? []).map((r: unknown) =>
    reviewRowToApi(r as Parameters<typeof reviewRowToApi>[0])
  );

  let isBookmarked = false;
  const userReviewRow = reviewRows?.find((r: { user_id: string }) => r.user_id === user?.id);
  const userReview = userReviewRow
    ? reviewRowToApi(userReviewRow as Parameters<typeof reviewRowToApi>[0])
    : null;
  if (user) {
    const { data: bookmark } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", id)
      .single();
    isBookmarked = !!bookmark;
  }

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-screen bg-light-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <ListingDetail
            listing={listing}
            universityName={universityName ?? undefined}
            isOwner={isOwner}
            galleryPhotos={galleryPhotos.length > 0 ? galleryPhotos : undefined}
          />
          <BookmarkButton
            listingId={id}
            initialBookmarked={isBookmarked}
            isLoggedIn={!!user}
          />
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ListingMap
              listing={listing}
              universityName={universityName ?? undefined}
              universitySlug={listing.universitySlug}
            />
          </div>
        </div>

        <section className="mt-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              {reviews.length > 0 ? (
                <>
                  <h2 className="text-2xl font-semibold text-dark-text">
                    Reviews ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
                  </h2>
                  <StarRating
                    rating={listing.avgRating ?? 0}
                    reviewCount={listing.reviewCount ?? 0}
                  />
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-semibold text-dark-text">
                    Reviews
                  </h2>
                  <span className="text-sm text-gray-500">
                    No reviews yet — be the first!
                  </span>
                </>
              )}
            </div>
            {user ? (
              <a
                href="#review-form"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                {userReview ? "Edit Your Review" : "+ Write a Review"}
              </a>
            ) : (
              <Link
                href={`/auth/login?redirect=/listing/${id}`}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                Log in to leave a review
              </Link>
            )}
          </div>
          <ReviewSection
            reviews={reviews}
            listingId={id}
            userReview={userReview}
            isLoggedIn={!!user}
            isAdmin={isAdmin}
          />
        </section>
      </div>
    </div>
  );
}
