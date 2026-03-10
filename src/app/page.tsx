import { SearchBar } from "@/components/filters/SearchBar";
import { UniversityCard } from "@/components/university/UniversityCard";
import { TopRatedCarousel } from "@/components/listings/TopRatedCarousel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { universityRowToApi } from "@/lib/api-transform";
import { listingRowToApi } from "@/lib/api-transform";
import type { UniversityRow } from "@/lib/db-types";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const { data: uniRows } = await supabase
    .from("universities")
    .select("*, listings(count)")
    .eq("listings.is_active", true)
    .order("name");

  const universities = (uniRows ?? []).map((u) => {
    const raw = u as UniversityRow & { listings?: { count: number }[] | number };
    const listingCount =
      typeof raw.listings === "number"
        ? raw.listings
        : Array.isArray(raw.listings)
          ? raw.listings[0]?.count ?? 0
          : 0;
    return universityRowToApi({ ...raw, listing_count: listingCount });
  });

  const { data: topListingRows } = await supabase
    .from("listings")
    .select("*, listing_photos(*), universities(slug)")
    .eq("is_active", true)
    .order("avg_rating", { ascending: false })
    .limit(10);

  const topListings = (topListingRows ?? []).map((r: unknown) =>
    listingRowToApi(r as Parameters<typeof listingRowToApi>[0])
  );

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="px-4 py-16 sm:py-20 sm:px-6 lg:px-8"
        style={{ background: "linear-gradient(to bottom, #EEF2FF, #F8FAFC)" }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-dark-text">
            Find your next home near campus
          </h1>
          <p className="mt-4 text-lg text-medium-text max-w-2xl mx-auto">
            Browse student-friendly rentals near Ontario&apos;s top universities
          </p>
          <div className="mt-8 max-w-3xl mx-auto">
            <SearchBar layout="hero" />
          </div>
        </div>
      </section>

      {/* Browse by University */}
      <section className="px-4 py-12 sm:py-16 sm:px-6 lg:px-8 bg-light-bg">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-semibold text-dark-text">
            Browse by University
          </h2>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {universities.map((u) => (
              <UniversityCard key={u.id} university={u} />
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated Listings */}
      <section className="px-4 py-12 sm:py-16 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-7xl">
          <TopRatedCarousel listings={topListings} />
        </div>
      </section>
    </div>
  );
}
