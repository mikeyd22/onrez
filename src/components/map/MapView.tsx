"use client";

import { useRef, useCallback, useImperativeHandle, forwardRef } from "react";
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
  },
  ref
) {
  const mapRef = useRef<MapRef>(null);

  useImperativeHandle(ref, () => ({
    flyTo(lat: number, lng: number, z: number) {
      mapRef.current?.flyTo({ center: [lng, lat], zoom: z, duration: 1500 });
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
      initialViewState={{
        longitude: center.lng,
        latitude: center.lat,
        zoom,
      }}
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
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-md">
            {u.slug.slice(0, 2).toUpperCase()}
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
