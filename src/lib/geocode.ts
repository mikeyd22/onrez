/**
 * Server-side geocoding using Mapbox Geocoding API (same provider as the map).
 * Used when creating/updating listings so the saved coordinates always match the address.
 */

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
}

/**
 * Forward geocode an address string using Mapbox. Returns coordinates or null if not found.
 * Restricts to Canada for relevance.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!MAPBOX_TOKEN?.trim() || !address?.trim()) return null;
  const encoded = encodeURIComponent(address.trim());
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=1&country=CA&types=address,place,locality`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { features?: { center: [number, number] }[] };
    const feature = data.features?.[0];
    if (!feature?.center || feature.center.length < 2) return null;
    const [lng, lat] = feature.center;
    if (typeof lat !== "number" || typeof lng !== "number") return null;
    return { latitude: lat, longitude: lng };
  } catch {
    return null;
  }
}
