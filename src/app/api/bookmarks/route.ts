import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listingRowToApi } from "@/lib/api-transform";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: rows, error } = await supabase
      .from("bookmarks")
      .select("listing_id")
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const listingIds = (rows ?? []).map((r) => r.listing_id);
    if (listingIds.length === 0) return NextResponse.json({ bookmarks: [], listings: [] });

    const { data: listingRows, error: listError } = await supabase
      .from("listings")
      .select("*, listing_photos(*), universities(slug)")
      .in("id", listingIds)
      .eq("is_active", true);

    if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });
    const listings = (listingRows ?? []).map((r: unknown) => listingRowToApi(r as Parameters<typeof listingRowToApi>[0]));
    return NextResponse.json({ bookmarks: rows, listings });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { listing_id: listingId } = body;
    if (!listingId) return NextResponse.json({ error: "listing_id required" }, { status: 400 });

    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .single();

    if (existing) {
      await supabase.from("bookmarks").delete().eq("id", existing.id);
      return NextResponse.json({ bookmarked: false });
    }
    await supabase.from("bookmarks").insert({ user_id: user.id, listing_id: listingId });
    return NextResponse.json({ bookmarked: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
