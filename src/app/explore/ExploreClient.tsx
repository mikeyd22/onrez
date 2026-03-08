"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/filters/SearchBar";
import { FilterPanel, DEFAULT_FILTERS, type FilterState } from "@/components/filters/FilterPanel";
import { SortDropdown, type SortOption } from "@/components/filters/SortDropdown";
import { ListingGrid } from "@/components/listings/ListingGrid";
import type { Listing } from "@/types";

interface ExploreClientProps {
  initialListings: Listing[];
  initialTotal: number;
  universities: { id: string; name: string; slug: string }[];
  initialKeyword: string;
  initialUniversitySlug: string;
  pageSize: number;
}

export function ExploreClient({
  initialListings,
  initialTotal,
  universities,
  initialKeyword,
  initialUniversitySlug,
  pageSize,
}: ExploreClientProps) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? initialKeyword;
  const u = searchParams.get("university") ?? initialUniversitySlug;

  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [total, setTotal] = useState<number>(initialTotal);
  const [keyword, setKeyword] = useState(q);
  const [universitySlug, setUniversitySlug] = useState(u);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("rating");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setKeyword(q);
    setUniversitySlug(u);
    setListings(initialListings);
    setTotal(initialTotal);
    setPage(0);
  }, [q, u, initialListings, initialTotal]);

  const fetchListings = useCallback(
    async (pageNum: number, append: boolean) => {
      setLoading(true);
      const params = new URLSearchParams();
      if (keyword) params.set("q", keyword);
      if (universitySlug) params.set("university", universitySlug);
      if (filters.priceMin > 0) params.set("minPrice", String(filters.priceMin));
      if (filters.priceMax < 2500) params.set("maxPrice", String(filters.priceMax));
      if (filters.bedrooms != null) params.set("bedrooms", String(filters.bedrooms));
      if (filters.propertyType) params.set("propertyType", filters.propertyType);
      params.set("sort", sort);
      params.set("page", String(pageNum));
      params.set("limit", String(pageSize));

      try {
        const res = await fetch(`/api/listings?${params}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const next = data.listings ?? [];
        setTotal(data.total ?? 0);
        setListings((prev) => (append ? [...prev, ...next] : next));
      } catch (err) {
        console.error(err);
        if (!append) setListings([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [keyword, universitySlug, filters, sort, pageSize]
  );

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(0);
  }, []);

  const handleSortChange = useCallback((newSort: SortOption) => {
    setSort(newSort);
    setPage(0);
  }, []);

  useEffect(() => {
    const hasNonInitial =
      keyword !== initialKeyword ||
      universitySlug !== initialUniversitySlug ||
      filters.priceMin !== DEFAULT_FILTERS.priceMin ||
      filters.priceMax !== DEFAULT_FILTERS.priceMax ||
      filters.bedrooms !== DEFAULT_FILTERS.bedrooms ||
      filters.propertyType !== DEFAULT_FILTERS.propertyType ||
      sort !== "rating";

    if (page === 0 && hasNonInitial) {
      fetchListings(0, false);
    }
  }, [keyword, universitySlug, filters, sort, page]);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(0);
  }, []);

  const hasMore = listings.length < total;
  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchListings(nextPage, true);
  }, [page, fetchListings]);

  return (
    <div className="min-h-screen bg-light-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-dark-text">Explore Popular Listings</h1>
        <p className="mt-2 text-medium-text">Top-rated student housing across Ontario</p>

        <div className="mt-6">
          <SearchBar
            defaultKeyword={keyword}
            defaultUniversity={universitySlug}
            layout="inline"
          />
        </div>

        <div className="mt-6">
          <FilterPanel
            value={filters}
            onChange={handleFiltersChange}
            onClear={clearFilters}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-medium-text">
            {loading ? "Loading…" : `Showing ${listings.length} of ${total} listings`}
          </p>
          <SortDropdown value={sort} onChange={handleSortChange} />
        </div>

        <div className="mt-6">
          {loading && listings.length === 0 ? (
            <div className="rounded-xl bg-white border border-border p-12 text-center text-medium-text">
              Loading…
            </div>
          ) : (
            <ListingGrid listings={listings} />
          )}
        </div>

        {hasMore && !loading && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              className="rounded-lg bg-primary px-6 py-2.5 text-white font-medium hover:opacity-90 transition-all"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
