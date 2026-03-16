"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Map, { Marker, NavigationControl, MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Listing } from "@/types";
import { MapControls } from "@/components/map/MapControls";
import Link from "next/link";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export interface ListingMapUniversity {
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  logoUrl?: string;
}

interface ListingMapProps {
  listing: Listing;
  universityName?: string;
  universitySlug?: string;
  /** When provided, the map shows both the listing location and the university (school) location. */
  university?: ListingMapUniversity;
}

function getUniversityInitials(name: string): string {
  const known: Record<string, string> = {
    "University of Waterloo": "UW",
    "University of Toronto": "UofT",
    "Western University": "Western",
    "McMaster University": "Mac",
    "Queen's University": "Queen's",
    "University of Ottawa": "uOttawa",
    "Toronto Metropolitan University": "TMU",
    "York University": "York",
    "Wilfrid Laurier University": "WLU",
    "University of Guelph": "UofG",
  };
  return (known[name] ?? name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 3)) || "?";
}

export function ListingMap({
  listing,
  universityName,
  universitySlug,
  university,
}: ListingMapProps) {
  const mapRef = useRef<MapRef>(null);
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

  const hasValidCoords =
    typeof listing.latitude === "number" &&
    typeof listing.longitude === "number" &&
    (listing.latitude !== 0 || listing.longitude !== 0);
  const addressLine = [listing.address, listing.city].filter(Boolean).join(", ");

  const fitBoundsToListingAndSchool = useCallback(() => {
    if (!university || !mapRef.current) return;
    const map = mapRef.current.getMap();
    const lngs = [listing.longitude, university.longitude];
    const lats = [listing.latitude, university.latitude];
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 80, duration: 0, maxZoom: 14 }
    );
  }, [university, listing.latitude, listing.longitude]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-dark-text">Location</h2>
        {addressLine && (
          <p className="text-medium-text text-sm">{addressLine}</p>
        )}
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

  if (!hasValidCoords) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-dark-text">Location</h2>
        {addressLine && (
          <p className="text-medium-text text-sm">{addressLine}</p>
        )}
        <div className="h-[300px] rounded-xl bg-gray-100 flex items-center justify-center text-medium-text text-sm border border-border">
          Map location not set. Edit the listing to set an address with a map position.
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
      {addressLine && (
        <p className="text-medium-text text-sm">{addressLine}</p>
      )}
      <div className="rounded-xl overflow-hidden border border-border h-[300px]">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: listing.longitude,
            latitude: listing.latitude,
            zoom: 14,
          }}
          onLoad={() => fitBoundsToListingAndSchool()}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/light-v11"
        >
          <NavigationControl position="top-right" />
          <Marker
            longitude={listing.longitude}
            latitude={listing.latitude}
            anchor="center"
            style={{ zIndex: 10 }}
          >
            <div className="w-6 h-6 rounded-full bg-primary border-2 border-white shadow-md" title="Listing address" />
          </Marker>
          {university && (
            <Marker
              longitude={university.longitude}
              latitude={university.latitude}
              anchor="center"
              style={{ zIndex: 5 }}
            >
              <div className="relative group cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-primary border-2 border-white shadow-md overflow-hidden flex items-center justify-center">
                  {university.logoUrl ? (
                    <img src={university.logoUrl} alt={university.name} className="w-full h-full object-cover object-center" />
                  ) : (
                    <span className="text-xs font-bold text-white">{getUniversityInitials(university.name)}</span>
                  )}
                </div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  {university.name}
                </div>
              </div>
            </Marker>
          )}
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
