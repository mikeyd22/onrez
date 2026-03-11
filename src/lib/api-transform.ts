import type { Listing, University, Review, UniversityReview } from "@/types";
import type { ListingRow, ListingPhotoRow, UniversityRow, ReviewRow, ProfileRow, UniversityReviewRow } from "./db-types";

export function listingRowToApi(row: ListingRow & { listing_photos?: ListingPhotoRow[]; universities?: { slug: string } | null }): Listing {
  const photos = row.listing_photos ?? [];
  const images = photos.sort((a, b) => a.display_order - b.display_order).map((p) => p.url);
  return {
    id: row.id,
    title: row.title ?? row.address,
    address: row.address,
    city: row.city ?? "",
    latitude: row.latitude,
    longitude: row.longitude,
    pricePerMonth: row.price_per_month,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    propertyType: (row.property_type ?? "apartment") as Listing["propertyType"],
    amenities: row.amenities ?? [],
    images: images.length ? images : ["/images/placeholder-listing.jpg"],
    universitySlug: row.universities?.slug ?? "",
    avgRating: Number(row.avg_rating) ?? 0,
    reviewCount: row.review_count ?? 0,
    availableFrom: row.available_from ?? new Date().toISOString().slice(0, 10),
    description: row.description ?? "",
    residencyStatus: (row.residency_status as Listing["residencyStatus"]) ?? null,
    lastStayedMonth: row.last_stayed_month ?? null,
    lastStayedYear: row.last_stayed_year ?? null,
    isActive: row.is_active ?? true,
  };
}

export function universityRowToApi(row: UniversityRow & { listing_count?: number; avg_rent?: number }): University {
  const rawCover = row.cover_image_url ?? "";
  const useLocalCover =
    !rawCover || rawCover.includes("placehold.co");
  const coverImageUrl = useLocalCover
    ? `/images/universities/${row.slug}.jpg`
    : rawCover;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    city: row.city,
    latitude: row.latitude,
    longitude: row.longitude,
    description: row.description ?? "",
    logoUrl: row.logo_url ?? "",
    coverImageUrl,
    listingCount: row.listing_count ?? 0,
    avgRent: row.avg_rent ?? 0,
  };
}

export function reviewRowToApi(row: ReviewRow & { profiles?: ProfileRow | null }): Review {
  return {
    id: row.id,
    listingId: row.listing_id,
    userName: row.profiles?.display_name ?? row.profiles?.email ?? "Anonymous",
    avatarUrl: row.profiles?.avatar_url ?? `https://placehold.co/40x40/E2E8F0/64748B?text=${(row.profiles?.display_name ?? "?")[0]}`,
    rating: row.rating,
    comment: row.comment ?? "",
    createdAt: row.created_at,
  };
}

export function universityReviewRowToApi(
  row: UniversityReviewRow & { profiles?: ProfileRow | null }
): UniversityReview {
  return {
    id: row.id,
    universityId: row.university_id,
    userName: row.profiles?.display_name ?? row.profiles?.email ?? "Anonymous",
    avatarUrl: row.profiles?.avatar_url ?? `https://placehold.co/40x40/E2E8F0/64748B?text=${(row.profiles?.display_name ?? "?")[0]}`,
    rating: row.rating,
    comment: row.comment ?? "",
    createdAt: row.created_at,
  };
}
