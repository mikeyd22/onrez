import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listingRowToApi } from "@/lib/api-transform";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const university = searchParams.get("university");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const bedrooms = searchParams.get("bedrooms");
  const propertyType = searchParams.get("propertyType");
  const sort = searchParams.get("sort") ?? "rating";
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "12", 10)));
  const bounds = searchParams.get("bounds"); // optional: "south,west,north,east"

  try {
    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from("listings")
      .select("*, listing_photos(*), review_photos(*), universities(slug)", { count: "exact" })
      .eq("is_active", true);

    if (q?.trim()) {
      const term = q.trim().replace(/%/g, "\\%");
      query = query.or(`title.ilike.%${term}%,address.ilike.%${term}%,description.ilike.%${term}%,city.ilike.%${term}%`);
    }
    if (university) {
      const { data: uni } = await supabase.from("universities").select("id").eq("slug", university).single();
      if (uni) query = query.eq("university_id", uni.id);
    }
    if (minPrice) query = query.gte("price_per_month", parseInt(minPrice, 10));
    if (maxPrice) query = query.lte("price_per_month", parseInt(maxPrice, 10));
    if (bedrooms) query = query.eq("bedrooms", parseInt(bedrooms, 10));
    if (propertyType) query = query.eq("property_type", propertyType);

    if (bounds) {
      const [south, west, north, east] = bounds.split(",").map(Number);
      if ([south, west, north, east].every(Number.isFinite)) {
        query = query.gte("latitude", south).lte("latitude", north).gte("longitude", west).lte("longitude", east);
      }
    }

    switch (sort) {
      case "price_asc":
        query = query.order("price_per_month", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price_per_month", { ascending: false });
        break;
      case "reviews":
        query = query.order("review_count", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      default:
        query = query.order("avg_rating", { ascending: false });
    }

    const from = page * limit;
    const to = from + limit - 1;
    const { data: rows, error, count } = await query.range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const listings = (rows ?? []).map((r: unknown) => listingRowToApi(r as Parameters<typeof listingRowToApi>[0]));
    return NextResponse.json({ listings, total: count ?? listings.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      address,
      city,
      latitude,
      longitude,
      pricePerMonth,
      bedrooms = 1,
      bathrooms = 1,
      propertyType,
      amenities = [],
      universitySlug,
      imageUrls = [],
      residencyStatus,
      lastStayedMonth,
      lastStayedYear,
    } = body;

    if (!address?.trim()) {
      return NextResponse.json({ error: "Address is required." }, { status: 400 });
    }
    if (pricePerMonth == null || pricePerMonth < 1) {
      return NextResponse.json({ error: "Price is required and must be at least $1." }, { status: 400 });
    }
    if (bedrooms == null || bathrooms == null) {
      return NextResponse.json({ error: "Bedrooms and bathrooms are required." }, { status: 400 });
    }
    if (!propertyType) {
      return NextResponse.json({ error: "Property type is required." }, { status: 400 });
    }
    if (!residencyStatus) {
      return NextResponse.json({ error: "Living status is required." }, { status: 400 });
    }
    if (!body.universitySlug?.trim()) {
      return NextResponse.json({ error: "Please select your university." }, { status: 400 });
    }
    const lat = latitude != null ? Number(latitude) : 43.47;
    const lng = longitude != null ? Number(longitude) : -80.54;

    let universityId: string | null = null;
    if (universitySlug) {
      const { data: uni } = await supabase.from("universities").select("id").eq("slug", universitySlug).single();
      universityId = uni?.id ?? null;
    }
    if (!universityId) {
      return NextResponse.json({ error: "Please select your university." }, { status: 400 });
    }

    const listingTitle = title ?? address;

    const { data: listing, error: insertError } = await supabase
      .from("listings")
      .insert({
        title: listingTitle,
        description: description ?? null,
        address,
        city: city?.trim() || null,
        latitude: lat,
        longitude: lng,
        price_per_month: Number(pricePerMonth),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        property_type: propertyType ?? null,
        amenities: Array.isArray(amenities) ? amenities : [],
        university_id: universityId,
        owner_id: user.id,
        is_active: true,
        residency_status: residencyStatus ?? null,
        last_stayed_month: residencyStatus === "last_stayed" && lastStayedMonth != null ? Number(lastStayedMonth) : null,
        last_stayed_year: residencyStatus === "last_stayed" && lastStayedYear != null ? Number(lastStayedYear) : null,
      })
      .select("id")
      .single();

    if (insertError || !listing) {
      return NextResponse.json({ error: insertError?.message ?? "Insert failed" }, { status: 500 });
    }

    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      await supabase.from("listing_photos").insert(
        imageUrls.map((url: string, i: number) => ({
          listing_id: listing.id,
          url,
          display_order: i,
        }))
      );
    }

    return NextResponse.json({ id: listing.id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
