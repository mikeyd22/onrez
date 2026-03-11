import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listingRowToApi } from "@/lib/api-transform";
import { ExploreClient } from "./ExploreClient";

const PAGE_SIZE = 24;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const universitySlug = params.university ?? "";

  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("listings")
    .select("*, listing_photos(*), review_photos(*), universities(slug)", { count: "exact" })
    .eq("is_active", true);

  if (q.trim()) {
    const term = q.trim().replace(/%/g, "\\%");
    query = query.or(
      `title.ilike.%${term}%,address.ilike.%${term}%,description.ilike.%${term}%,city.ilike.%${term}%`
    );
  }
  if (universitySlug) {
    const { data: uni } = await supabase
      .from("universities")
      .select("id")
      .eq("slug", universitySlug)
      .single();
    if (uni) query = query.eq("university_id", uni.id);
  }

  query = query.order("avg_rating", { ascending: false }).range(0, PAGE_SIZE - 1);

  const { data: rows, count } = await query;

  const initialListings = (rows ?? []).map((r: unknown) =>
    listingRowToApi(r as Parameters<typeof listingRowToApi>[0])
  );
  const initialTotal = count ?? initialListings.length;

  const { data: uniRows } = await supabase
    .from("universities")
    .select("id, name, slug")
    .order("name");
  const universities = uniRows ?? [];

  return (
    <Suspense fallback={<div className="min-h-screen bg-light-bg flex items-center justify-center">Loading…</div>}>
      <ExploreClient
        initialListings={initialListings}
        initialTotal={initialTotal}
        universities={universities}
        initialKeyword={q}
        initialUniversitySlug={universitySlug}
        pageSize={PAGE_SIZE}
      />
    </Suspense>
  );
}
