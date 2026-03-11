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
      {/* Hero — full photo background with overlay, extends under fixed navbar */}
      <section className="relative h-[520px] flex items-center justify-center -mt-[72px]">
        <div className="absolute inset-0">
          <img
            src="/images/hero-bg.jpeg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>
        <div className="relative z-10 text-center max-w-3xl mx-auto px-4 w-full pt-20">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Find your next home near campus
          </h1>
          <p className="text-lg text-white/80 mb-8">
            Browse student-friendly rentals near Ontario&apos;s top universities
          </p>
          <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] p-2 flex items-center gap-2 max-w-2xl mx-auto search-bar-hero">
            <SearchBar layout="heroPhoto" />
          </div>
        </div>
      </section>

      {/* Browse by University — white */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Browse by University
          </h2>
          <p className="text-gray-500 mb-8">
            Find housing near Ontario&apos;s top campuses
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {universities.map((u, i) => (
              <div
                key={u.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <UniversityCard university={u} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Rated Listings — light gray */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <TopRatedCarousel listings={topListings} />
        </div>
      </section>

      {/* CTA — blue */}
      <section className="bg-primary py-8 px-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">
          Know a great place?
        </h2>
        <p className="text-white/80 text-sm mb-4">
          Help other students find their next home
        </p>
        <a
          href="/listing/new"
          className="inline-flex items-center justify-center rounded-xl bg-white text-primary font-medium px-5 py-2 text-sm hover:bg-gray-100 transition-colors"
        >
          Post a Listing
        </a>
      </section>
    </div>
  );
}
