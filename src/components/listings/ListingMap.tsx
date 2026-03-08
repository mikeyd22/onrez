"use client";

import { useState, useEffect } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Listing } from "@/types";
import { MapControls } from "@/components/map/MapControls";
import Link from "next/link";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface ListingMapProps {
  listing: Listing;
  universityName?: string;
  universitySlug?: string;
}

export function ListingMap({
  listing,
  universityName,
  universitySlug,
}: ListingMapProps) {
  const [showTransit, setShowTransit] = useState(false);
  const [showFood, setShowFood] = useState(false);
  const [showShops, setShowShops] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<{ bus: { id: string; latitude: number; longitude: number }[]; food: { id: string; latitude: number; longitude: number }[]; shops: { id: string; latitude: number; longitude: number }[] }>({ bus: [], food: [], shops: [] });

  useEffect(() => {
    if (!showTransit && !showFood && !showShops) return;
    const type = showTransit ? "bus_stop" : showFood ? "restaurant" : "shopping";
    fetch(`/api/nearby?lat=${listing.latitude}&lng=${listing.longitude}&type=${type}&radius=1500`)
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
  }, [showTransit, showFood, showShops, listing.latitude, listing.longitude]);

  const busStops = nearbyPlaces.bus;
  const restaurants = nearbyPlaces.food;
  const shops = nearbyPlaces.shops;

  if (!MAPBOX_TOKEN) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-dark-text">Location</h2>
        <div className="h-[300px] rounded-xl bg-gray-100 flex items-center justify-center text-medium-text text-sm">
          Add NEXT_PUBLIC_MAPBOX_TOKEN to see the map.
        </div>
        {universitySlug && universityName && (
          <Link
            href={`/university/${universitySlug}`}
            className="text-sm font-medium text-primary hover:underline"
          >
            Near {universityName}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-dark-text">Location</h2>
        <MapControls
          transit={showTransit}
          food={showFood}
          shops={showShops}
          onTransit={setShowTransit}
          onFood={setShowFood}
          onShops={setShowShops}
        />
      </div>
      <div className="rounded-xl overflow-hidden border border-border h-[300px]">
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: listing.longitude,
            latitude: listing.latitude,
            zoom: 14,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/light-v11"
        >
          <NavigationControl position="top-right" />
          <Marker
            longitude={listing.longitude}
            latitude={listing.latitude}
            anchor="center"
          >
            <div className="w-6 h-6 rounded-full bg-primary border-2 border-white shadow-md" />
          </Marker>
          {showTransit &&
            busStops.map((p) => (
              <Marker key={p.id} longitude={p.longitude} latitude={p.latitude} anchor="center">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </Marker>
            ))}
          {showFood &&
            restaurants.map((p) => (
              <Marker key={p.id} longitude={p.longitude} latitude={p.latitude} anchor="center">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
              </Marker>
            ))}
          {showShops &&
            shops.map((p) => (
              <Marker key={p.id} longitude={p.longitude} latitude={p.latitude} anchor="center">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
              </Marker>
            ))}
        </Map>
      </div>
      {universitySlug && universityName && (
        <Link
          href={`/university/${universitySlug}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Near {universityName}
        </Link>
      )}
    </div>
  );
}
