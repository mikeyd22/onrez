import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MyReviewsClient } from "./MyReviewsClient";
import { reviewRowToApi } from "@/lib/api-transform";
import type { Review, ReviewPhoto } from "@/types";

export interface MyReviewItem extends Review {
  listings: {
    id: string;
    address: string;
    city: string | null;
    universities: { name: string; slug: string } | null;
  } | null;
}

function toMyReviewItem(row: {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  avatar_icon: string | null;
  created_at: string;
  updated_at: string;
  listings?: {
    id: string;
    address: string;
    city: string | null;
    university_id: string | null;
    universities: { name: string; slug: string } | null;
  } | null;
  review_photos?: { id: string; url: string; created_at: string; display_order: number }[];
}): MyReviewItem {
  const reviewPhotosAsRows = (row.review_photos ?? []).map((p) => ({
    id: p.id,
    review_id: row.id,
    listing_id: row.listing_id,
    user_id: row.user_id,
    url: p.url,
    display_order: p.display_order,
    created_at: p.created_at,
  }));
  const review = reviewRowToApi({
    ...row,
    review_photos: reviewPhotosAsRows,
  } as Parameters<typeof reviewRowToApi>[0]);
  return {
    ...review,
    listings: row.listings
      ? {
          id: row.listings.id,
          address: row.listings.address,
          city: row.listings.city,
          universities: row.listings.universities ?? null,
        }
      : null,
  };
}

export default async function MyReviewsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: rows } = await supabase
    .from("reviews")
    .select("*, listings(id, address, city, university_id, universities(name, slug)), review_photos(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const reviews = (rows ?? []).map((r: unknown) =>
    toMyReviewItem(r as Parameters<typeof toMyReviewItem>[0])
  );

  return (
    <div className="min-h-screen bg-light-bg">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-dark-text">My Reviews</h1>
        <p className="mt-2 text-medium-text">
          {reviews.length === 0
            ? "You haven't left any reviews yet."
            : `You've left ${reviews.length} review${reviews.length === 1 ? "" : "s"}`}
        </p>
        <MyReviewsClient reviews={reviews} />
      </div>
    </div>
  );
}
