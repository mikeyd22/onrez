import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { universityReviewRowToApi } from "@/lib/api-transform";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const universitySlug = searchParams.get("universitySlug");
  if (!universitySlug) {
    return NextResponse.json(
      { error: "Missing universitySlug" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: uni } = await supabase
    .from("universities")
    .select("id")
    .eq("slug", universitySlug)
    .single();
  if (!uni) {
    return NextResponse.json({ error: "University not found" }, { status: 404 });
  }

  const { data: rows } = await supabase
    .from("university_reviews")
    .select("*, profiles(display_name, email, avatar_url)")
    .eq("university_id", uni.id)
    .order("created_at", { ascending: false });

  const reviews = (rows ?? []).map((r: unknown) =>
    universityReviewRowToApi(r as Parameters<typeof universityReviewRowToApi>[0])
  );
  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { universitySlug, rating, comment } = body;
  if (!universitySlug || rating == null || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Missing universitySlug or invalid rating" },
      { status: 400 }
    );
  }

  const { data: uni } = await supabase
    .from("universities")
    .select("id")
    .eq("slug", universitySlug)
    .single();
  if (!uni) {
    return NextResponse.json({ error: "University not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("university_reviews")
    .select("id")
    .eq("university_id", uni.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    const { error: updateError } = await supabase
      .from("university_reviews")
      .update({
        rating: Number(rating),
        comment: comment ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }
    return NextResponse.json({ id: existing.id, updated: true });
  }

  const { data: inserted, error: insertError } = await supabase
    .from("university_reviews")
    .insert({
      university_id: uni.id,
      user_id: user.id,
      rating: Number(rating),
      comment: comment ?? null,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: insertError?.message ?? "Insert failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({ id: inserted.id });
}
