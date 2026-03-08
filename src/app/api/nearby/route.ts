import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

const OVERPASS_URL = process.env.OVERPASS_API_URL ?? "https://overpass-api.de/api/interpreter";

type NearbyType = "bus_stop" | "restaurant" | "shopping";

async function fetchOverpass(query: string): Promise<{ lat: number; lon: number; tags?: Record<string, string> }[]> {
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    body: query,
    headers: { "Content-Type": "text/plain" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
  const json = await res.json();
  const elements = json.elements ?? [];
  return elements
    .filter((e: { type: string; lat?: number; lon?: number }) => e.type === "node" && e.lat != null && e.lon != null)
    .map((e: { lat: number; lon: number; tags?: Record<string, string> }) => ({
      lat: e.lat,
      lon: e.lon,
      tags: e.tags,
    }));
}

function buildQuery(lat: number, lng: number, radius: number, type: NearbyType): string {
  const around = `around:${radius},${lat},${lng}`;
  switch (type) {
    case "bus_stop":
      return `[out:json];node["highway"="bus_stop"](${around});out body;`;
    case "restaurant":
      return `[out:json];node["amenity"~"restaurant|fast_food|cafe"](${around});out body;`;
    case "shopping":
      return `[out:json];node["shop"~"mall|supermarket|convenience"](${around});out body;`;
    default:
      return `[out:json];node(${around});out body;`;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");
  const type = (searchParams.get("type") ?? "bus_stop") as NearbyType;
  const radius = Math.min(5000, Math.max(200, parseInt(searchParams.get("radius") ?? "1000", 10)));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }
  if (!["bus_stop", "restaurant", "shopping"].includes(type)) {
    return NextResponse.json({ error: "type must be bus_stop, restaurant, or shopping" }, { status: 400 });
  }

  const cacheKey = `nearby-${lat}-${lng}-${type}-${radius}`;
  const getCached = () =>
    fetchOverpass(buildQuery(lat, lng, radius, type)).then((points) =>
      points.slice(0, 50).map((p, i) => ({
        id: `${type}-${i}-${p.lat}-${p.lon}`,
        name: p.tags?.name ?? type,
        type,
        latitude: p.lat,
        longitude: p.lon,
      }))
    );

  try {
    const places = await unstable_cache(getCached, [cacheKey], { revalidate: 3600 })();
    return NextResponse.json({ places });
  } catch (err) {
    return NextResponse.json({ error: String(err), places: [] }, { status: 200 });
  }
}
