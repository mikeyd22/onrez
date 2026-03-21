// Parallel /api/nearby helpers for transit, food, shops. Unused while map UIs pass empty POI arrays; re-wire when re-enabling layers.
import type { NearbyPlace } from "@/types";

export const NEARBY_PLACES_RADIUS_METERS = 1500;

export type NearbyLayerKey = "bus" | "food" | "shops";

const LAYER_TO_API_TYPE: Record<NearbyLayerKey, NearbyPlace["type"]> = {
  bus: "bus_stop",
  food: "restaurant",
  shops: "shopping",
};

function asNearbyPlaces(raw: unknown): NearbyPlace[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => {
    const o = p as {
      id: string;
      name: string;
      type: string;
      latitude: number;
      longitude: number;
    };
    return {
      ...o,
      type: o.type as NearbyPlace["type"],
    };
  });
}

/** Fetches enabled layers in parallel. Uses allSettled so one failed request does not drop others. Throws AbortError if `signal` is aborted after work completes. */
export async function fetchNearbyLayers(opts: {
  lat: number;
  lng: number;
  layers: NearbyLayerKey[];
  signal?: AbortSignal;
}): Promise<Partial<Record<NearbyLayerKey, NearbyPlace[]>>> {
  const { lat, lng, layers, signal } = opts;
  if (layers.length === 0) return {};

  const settled = await Promise.allSettled(
    layers.map(async (layer) => {
      const type = LAYER_TO_API_TYPE[layer];
      const res = await fetch(
        `/api/nearby?lat=${lat}&lng=${lng}&type=${type}&radius=${NEARBY_PLACES_RADIUS_METERS}`,
        { signal }
      );
      const data = (await res.json()) as { places?: unknown };
      const places = asNearbyPlaces(data.places);
      return { layer, places };
    })
  );

  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const out: Partial<Record<NearbyLayerKey, NearbyPlace[]>> = {};
  for (const entry of settled) {
    if (entry.status === "fulfilled") {
      out[entry.value.layer] = entry.value.places;
    }
  }
  return out;
}

export function nearbyLayersFromToggles(
  showTransit: boolean,
  showFood: boolean,
  showShops: boolean
): NearbyLayerKey[] {
  const layers: NearbyLayerKey[] = [];
  if (showTransit) layers.push("bus");
  if (showFood) layers.push("food");
  if (showShops) layers.push("shops");
  return layers;
}
