import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { listingRowToApi } from "@/lib/api-transform";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: row, error } = await supabase
      .from("listings")
      .select("*, listing_photos(*), universities(slug)")
      .eq("id", id)
      .single();

    if (error || !row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!row.is_active) {
      const { data: { user } } = await supabase.auth.getUser();
      const admin = await isAdmin(supabase);
      if (!user || (!admin && row.owner_id !== user.id)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    return NextResponse.json(listingRowToApi(row as Parameters<typeof listingRowToApi>[0]));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: existing } = await supabase.from("listings").select("owner_id").eq("id", id).single();
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const admin = await isAdmin(supabase);
    if (existing.owner_id !== user.id && !admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const update: Record<string, unknown> = {};
    const allowed = [
      "title", "description", "address", "city", "latitude", "longitude",
      "price_per_month", "bedrooms", "bathrooms", "property_type", "amenities",
      "available_from", "available_to", "university_id", "is_active",
      "residency_status", "last_stayed_month", "last_stayed_year",
    ];
    for (const key of allowed) {
      const camel = key === "price_per_month" ? "pricePerMonth" : key === "property_type" ? "propertyType" : key === "available_from" ? "availableFrom" : key === "available_to" ? "availableTo" : key === "university_id" ? "universityId" : key === "residency_status" ? "residencyStatus" : key === "last_stayed_month" ? "lastStayedMonth" : key === "last_stayed_year" ? "lastStayedYear" : key;
      if (body[camel] !== undefined) update[key] = body[camel];
    }
    if (body.universitySlug && !body.universityId) {
      const { data: uni } = await supabase.from("universities").select("id").eq("slug", body.universitySlug).single();
      if (uni) update.university_id = uni.id;
    }
    update.updated_at = new Date().toISOString();

    const { data: row, error } = await supabase
      .from("listings")
      .update(update)
      .eq("id", id)
      .select("*, listing_photos(*), universities(slug)")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(listingRowToApi(row as Parameters<typeof listingRowToApi>[0]));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: existing } = await supabase.from("listings").select("owner_id").eq("id", id).single();
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const admin = await isAdmin(supabase);
    if (existing.owner_id !== user.id && !admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await supabase.from("listings").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
