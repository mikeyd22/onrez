import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { reviewRowToApi } from "@/lib/api-transform";
import { getRandomAvatar } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const listingId = request.nextUrl.searchParams.get("listing_id");
  if (!listingId) {
    return NextResponse.json({ error: "listing_id required" }, { status: 400 });
  }
  try {
    const supabase = await createServerSupabaseClient();
    const { data: rows, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const reviews = (rows ?? []).map((r: unknown) => reviewRowToApi(r as Parameters<typeof reviewRowToApi>[0]));
    return NextResponse.json({ reviews });
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
    const { listing_id: listingId, rating, comment, avatar_icon: avatarIcon } = body;
    if (!listingId || rating == null || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "listing_id and rating (1-5) required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("reviews")
      .select("avatar_icon")
      .eq("listing_id", listingId)
      .eq("user_id", user.id)
      .maybeSingle();

    const avatarIconToSave = existing?.avatar_icon ?? avatarIcon ?? getRandomAvatar();

    const payload = {
      listing_id: listingId,
      user_id: user.id,
      rating: Number(rating),
      comment: comment ?? null,
      avatar_icon: avatarIconToSave,
      updated_at: new Date().toISOString(),
    };

    const { data: row, error } = await supabase
      .from("reviews")
      .upsert(payload, { onConflict: "listing_id,user_id" })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(reviewRowToApi(row as Parameters<typeof reviewRowToApi>[0]));
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
