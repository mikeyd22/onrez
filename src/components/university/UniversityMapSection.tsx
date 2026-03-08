"use client";

import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapView, type MapViewHandle } from "@/components/map/MapView";
import { MapControls } from "@/components/map/MapControls";
import type { University } from "@/types";
import type { Listing } from "@/types";
import type { NearbyPlace } from "@/types";

const MapViewDynamic = dynamic(
  () => import("@/components/map/MapView").then((m) => ({ default: m.MapView })),
  { ssr: false }
);

interface UniversityMapSectionProps {
  university: University;
  listings: Listing[];
}

export function UniversityMapSection({
  university,
  listings,
}: UniversityMapSectionProps) {
  const [showTransit, setShowTransit] = useState(false);
  const [showFood, setShowFood] = useState(false);
  const [showShops, setShowShops] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<{ bus: NearbyPlace[]; food: NearbyPlace[]; shops: NearbyPlace[] }>({ bus: [], food: [], shops: [] });

  useEffect(() => {
    if (!showTransit && !showFood && !showShops) return;
    const type = showTransit ? "bus_stop" : showFood ? "restaurant" : "shopping";
    fetch(`/api/nearby?lat=${university.latitude}&lng=${university.longitude}&type=${type}&radius=1500`)
      .then((res) => res.json())
      .then((data) => {
        const places: NearbyPlace[] = (data.places ?? []).map((p: { id: string; name: string; type: string; latitude: number; longitude: number }) => ({
          ...p,
          type: p.type as NearbyPlace["type"],
        }));
        setNearbyPlaces((prev) => ({
          ...prev,
          bus: type === "bus_stop" ? places : prev.bus,
          food: type === "restaurant" ? places : prev.food,
          shops: type === "shopping" ? places : prev.shops,
        }));
      });
  }, [showTransit, showFood, showShops, university.latitude, university.longitude]);

  const busStops = nearbyPlaces.bus;
  const restaurants = nearbyPlaces.food;
  const shops = nearbyPlaces.shops;

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-white shadow-sm">
      <div className="p-3 border-b border-border flex flex-wrap gap-2">
        <MapControls
          transit={showTransit}
          food={showFood}
          shops={showShops}
          onTransit={setShowTransit}
          onFood={setShowFood}
          onShops={setShowShops}
        />
      </div>
      <div className="h-[400px] w-full">
        <MapViewDynamic
          listings={listings}
          universities={[university]}
          busStops={busStops}
          restaurants={restaurants}
          shops={shops}
          showTransit={showTransit}
          showFood={showFood}
          showShops={showShops}
          center={{ lat: university.latitude, lng: university.longitude }}
          zoom={14}
          selectedListingId={selectedId}
          onSelectListing={setSelectedId}
        />
      </div>
    </div>
  );
}
