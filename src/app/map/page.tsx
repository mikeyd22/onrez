"use client";

import { useCallback, useRef, useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { MapViewHandle } from "@/components/map/MapView";
import { SchoolFilter } from "@/components/map/SchoolFilter";
import { MapControls } from "@/components/map/MapControls";
import { ListingCard } from "@/components/listings/ListingCard";
import { createClient } from "@/lib/supabase/client";
import { listingRowToApi, universityRowToApi } from "@/lib/api-transform";
import type { Listing } from "@/types";
import type { University } from "@/types";
import type { NearbyPlace } from "@/types";
import type { UniversityRow } from "@/lib/db-types";

const ONTARIO_CENTER = { lat: 43.7, lng: -79.5 };
const ONTARIO_ZOOM = 6;
const DEBOUNCE_MS = 300;

const MapViewDynamic = dynamic(
  () => import("@/components/map/MapView").then((m) => ({ default: m.MapView })),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100">Loading map...</div> }
);

function MapPageContent() {
  const searchParams = useSearchParams();
  const universityParam = searchParams.get("university") ?? "";
  const mapRef = useRef<MapViewHandle>(null);
  const supabase = createClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [universities, setUniversities] = useState<University[]>([]);
  const [schoolSlug, setSchoolSlug] = useState(universityParam || "");
  const [showTransit, setShowTransit] = useState(false);
  const [showFood, setShowFood] = useState(false);
  const [showShops, setShowShops] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [viewportListings, setViewportListings] = useState<Listing[]>([]);
  const [center, setCenter] = useState(ONTARIO_CENTER);
  const [zoom, setZoom] = useState(ONTARIO_ZOOM);
  const [nearbyPlaces, setNearbyPlaces] = useState<{ bus: NearbyPlace[]; food: NearbyPlace[]; shops: NearbyPlace[] }>({
    bus: [],
    food: [],
    shops: [],
  });

  useEffect(() => {
    supabase.from("universities").select("*").then(({ data }) => {
      if (data) setUniversities(data.map((u) => universityRowToApi({ ...u, listing_count: 0, avg_rent: 0 } as UniversityRow & { listing_count: number; avg_rent: number })));
    });
  }, []);

  const fetchListingsInBounds = useCallback(() => {
    const bounds = mapRef.current?.getBounds();
    if (!bounds || zoom < 12) {
      setViewportListings([]);
      return;
    }
    supabase
      .rpc("listings_in_bounds", {
        min_lat: bounds.south,
        max_lat: bounds.north,
        min_lng: bounds.west,
        max_lng: bounds.east,
      })
      .then(({ data: rows }) => {
        if (!rows?.length) {
          setViewportListings([]);
          return;
        }
        const ids = rows.map((r: { id: string }) => r.id);
        supabase
          .from("listings")
          .select("*, listing_photos(*), universities(slug)")
          .in("id", ids)
          .then(({ data: fullRows }) => {
            const listings = (fullRows ?? []).map((r: unknown) =>
              listingRowToApi(r as Parameters<typeof listingRowToApi>[0])
            );
            setViewportListings(listings);
          });
      });
  }, [zoom, supabase]);

  const handleViewportChange = useCallback(
    (newCenter: { lat: number; lng: number }, newZoom: number) => {
      setCenter(newCenter);
      setZoom(newZoom);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (newZoom >= 12) {
        debounceRef.current = setTimeout(fetchListingsInBounds, DEBOUNCE_MS);
      } else {
        setViewportListings([]);
      }
    },
    [fetchListingsInBounds]
  );

  useEffect(() => {
    if (showTransit || showFood || showShops) {
      const type = showTransit ? "bus_stop" : showFood ? "restaurant" : "shopping";
      fetch(`/api/nearby?lat=${center.lat}&lng=${center.lng}&type=${type}&radius=1500`)
        .then((res) => res.json())
        .then((data) => {
          const places = data.places ?? [];
          setNearbyPlaces((prev) => ({
            ...prev,
            bus: type === "bus_stop" ? places : prev.bus,
            food: type === "restaurant" ? places : prev.food,
            shops: type === "shopping" ? places : prev.shops,
          }));
        });
    }
  }, [showTransit, showFood, showShops, center.lat, center.lng]);

  const filteredListings =
    schoolSlug === ""
      ? viewportListings
      : viewportListings.filter((l) => l.universitySlug === schoolSlug);

  useEffect(() => {
    if (universityParam && universities.some((u) => u.slug === universityParam)) {
      setSchoolSlug(universityParam);
      const u = universities.find((x) => x.slug === universityParam);
      if (u && mapRef.current) {
        mapRef.current.flyTo(u.latitude, u.longitude, 14);
        setCenter({ lat: u.latitude, lng: u.longitude });
        setZoom(14);
      }
    }
  }, [universityParam, universities]);

  const handleFlyTo = useCallback((lat: number, lng: number, z: number) => {
    mapRef.current?.flyTo(lat, lng, z);
    setCenter({ lat, lng });
    setZoom(z);
    if (z >= 12) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchListingsInBounds(), 800);
    }
  }, [fetchListingsInBounds]);

  const showCarousel = zoom >= 12 && filteredListings.length > 0;

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
        <SchoolFilter
          universities={universities}
          value={schoolSlug}
          onChange={(slug) => {
            setSchoolSlug(slug);
            if (!slug && mapRef.current) {
              mapRef.current.flyTo(
                ONTARIO_CENTER.lat,
                ONTARIO_CENTER.lng,
                ONTARIO_ZOOM
              );
              setCenter(ONTARIO_CENTER);
              setZoom(ONTARIO_ZOOM);
            }
          }}
          onFlyTo={handleFlyTo}
        />
        <MapControls
          transit={showTransit}
          food={showFood}
          shops={showShops}
          onTransit={setShowTransit}
          onFood={setShowFood}
          onShops={setShowShops}
        />
      </div>

      <div className="flex-1 min-h-0 relative">
        <MapViewDynamic
          ref={mapRef}
          listings={filteredListings}
          universities={universities}
          busStops={nearbyPlaces.bus}
          restaurants={nearbyPlaces.food}
          shops={nearbyPlaces.shops}
          showTransit={showTransit}
          showFood={showFood}
          showShops={showShops}
          center={center}
          zoom={zoom}
          onViewportChange={handleViewportChange}
          selectedListingId={selectedListingId}
          onSelectListing={setSelectedListingId}
        />
      </div>

      {showCarousel && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur border-t border-border p-4">
          <p className="text-sm font-medium text-dark-text mb-3">
            Listings in this area
          </p>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {filteredListings.slice(0, 12).map((listing) => (
              <div key={listing.id} className="shrink-0 w-64">
                <ListingCard listing={listing} compact />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  );
}
