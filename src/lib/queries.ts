/**
 * Reusable query helpers for listings. Used by API routes or server components.
 * Import createServerSupabaseClient() and pass it, or use from API route context.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type ListingsSort = "rating" | "price_asc" | "price_desc" | "reviews" | "newest";

export interface ListingsFilters {
  universitySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  propertyType?: string;
  sort?: ListingsSort;
  page?: number;
  limit?: number;
  bounds?: { south: number; west: number; north: number; east: number };
}

export async function getListings(
  supabase: SupabaseClient,
  filters: ListingsFilters = {}
) {
  const {
    universitySlug,
    minPrice,
    maxPrice,
    bedrooms,
    propertyType,
    sort = "rating",
    page = 0,
    limit = 12,
    bounds,
  } = filters;

  let query = supabase
    .from("listings")
    .select("*, listing_photos(*), universities(slug)", { count: "exact" })
    .eq("is_active", true);

  if (universitySlug) {
    const { data: uni } = await supabase.from("universities").select("id").eq("slug", universitySlug).single();
    if (uni) query = query.eq("university_id", uni.id);
  }
  if (minPrice != null) query = query.gte("price_per_month", minPrice);
  if (maxPrice != null) query = query.lte("price_per_month", maxPrice);
  if (bedrooms != null) query = query.eq("bedrooms", bedrooms);
  if (propertyType) query = query.eq("property_type", propertyType);
  if (bounds) {
    query = query
      .gte("latitude", bounds.south)
      .lte("latitude", bounds.north)
      .gte("longitude", bounds.west)
      .lte("longitude", bounds.east);
  }

  switch (sort) {
    case "price_asc":
      query = query.order("price_per_month", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_per_month", { ascending: false });
      break;
    case "reviews":
      query = query.order("review_count", { ascending: false });
      break;
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    default:
      query = query.order("avg_rating", { ascending: false });
  }

  const from = page * limit;
  const to = from + limit - 1;
  return query.range(from, to);
}
