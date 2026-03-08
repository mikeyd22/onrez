"use client";

import { useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import Map, {
  MapRef,
  Marker,
  NavigationControl,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Listing } from "@/types";
import type { University } from "@/types";
import type { NearbyPlace } from "@/types";
import { ListingMarker } from "./ListingMarker";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

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
  return known[name] ?? (name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 3) || "?");
}

export interface MapViewHandle {
  flyTo: (lat: number, lng: number, zoom: number) => void;
  getBounds: () => { north: number; south: number; east: number; west: number } | null;
}

interface MapViewProps {
  listings: Listing[];
  universities: University[];
  busStops: NearbyPlace[];
  restaurants: NearbyPlace[];
  shops: NearbyPlace[];
  showTransit: boolean;
  showFood: boolean;
  showShops: boolean;
  center: { lat: number; lng: number };
  zoom: number;
  onViewportChange?: (center: { lat: number; lng: number }, zoom: number) => void;
  selectedListingId: string | null;
  onSelectListing: (id: string | null) => void;
  onUniversityClick?: (university: University) => void;
}

const MapViewInner = forwardRef<MapViewHandle, MapViewProps>(function MapViewInner(
  {
    listings,
    universities,
    busStops,
    restaurants,
    shops,
    showTransit,
    showFood,
    showShops,
    center,
    zoom,
    onViewportChange,
    selectedListingId,
    onSelectListing,
    onUniversityClick,
  },
  ref
) {
  const mapRef = useRef<MapRef>(null);
  const [initialViewState] = useState(() => ({
    longitude: center.lng,
    latitude: center.lat,
    zoom,
  }));

  useImperativeHandle(ref, () => ({
    flyTo(lat: number, lng: number, z: number) {
      const map = mapRef.current?.getMap();
      if (map) map.flyTo({ center: [lng, lat], zoom: z, duration: 1500, essential: true });
    },
    getBounds() {
      const map = mapRef.current?.getMap();
      if (!map) return null;
      const b = map.getBounds();
      if (!b) return null;
      return {
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      };
    },
  }));

  const handleMove = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !onViewportChange) return;
    const c = map.getCenter();
    onViewportChange({ lat: c.lat, lng: c.lng }, map.getZoom());
  }, [onViewportChange]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg text-medium-text">
        Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local to enable the map.
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={initialViewState}
      onMove={handleMove}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/light-v11"
    >
      <NavigationControl position="top-right" />
      {universities.map((u) => (
        <Marker
          key={u.id}
          longitude={u.longitude}
          latitude={u.latitude}
          anchor="center"
          style={{ zIndex: 5 }}
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            const map = mapRef.current?.getMap();
            if (map) map.flyTo({ center: [u.longitude, u.latitude], zoom: 14, duration: 1500, essential: true });
            onUniversityClick?.(u);
          }}
        >
          <div className="relative cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-primary shadow-lg overflow-hidden flex items-center justify-center">
              {u.logoUrl ? (
                <img
                  src={u.logoUrl}
                  alt={u.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <span className="text-xs font-bold text-primary">
                  {getUniversityInitials(u.name)}
                </span>
              )}
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
              {u.name}
            </div>
          </div>
        </Marker>
      ))}
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          longitude={listing.longitude}
          latitude={listing.latitude}
          anchor="center"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            onSelectListing(listing.id);
            const map = mapRef.current?.getMap();
            if (map) map.flyTo({ center: [listing.longitude, listing.latitude], zoom: 15, duration: 1200, essential: true });
          }}
          style={{ zIndex: selectedListingId === listing.id ? 10 : 4 }}
        >
          <ListingMarker
            price={listing.pricePerMonth}
            selected={selectedListingId === listing.id}
            listing={listing}
          />
        </Marker>
      ))}
      {showTransit &&
        busStops.map((p) => (
          <Marker
            key={p.id}
            longitude={p.longitude}
            latitude={p.latitude}
            anchor="center"
          >
            <div className="w-2 h-2 rounded-full bg-primary" />
          </Marker>
        ))}
      {showFood &&
        restaurants.map((p) => (
          <Marker
            key={p.id}
            longitude={p.longitude}
            latitude={p.latitude}
            anchor="center"
          >
            <div className="w-2 h-2 rounded-full bg-orange-500" />
          </Marker>
        ))}
      {showShops &&
        shops.map((p) => (
          <Marker
            key={p.id}
            longitude={p.longitude}
            latitude={p.latitude}
            anchor="center"
          >
            <div className="w-2 h-2 rounded-full bg-purple-500" />
          </Marker>
        ))}
    </Map>
  );
});

export const MapView = MapViewInner;

/** Wrapper that receives ref via prop so ref works with next/dynamic */
export function MapViewWithRef(
  props: React.ComponentProps<typeof MapViewInner> & { forwardedRef: React.Ref<MapViewHandle> }
) {
  const { forwardedRef, ...rest } = props;
  return <MapViewInner ref={forwardedRef} {...rest} />;
}
