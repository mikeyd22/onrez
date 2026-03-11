import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { reviewRowToApi } from "@/lib/api-transform";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: review } = await supabase.from("reviews").select("user_id").eq("id", id).single();
    if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (review.user_id !== user.id && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updates: { rating?: number; comment?: string | null; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if (body.rating != null) updates.rating = Number(body.rating);
    if (body.comment !== undefined) updates.comment = body.comment === "" ? null : body.comment;

    const { data: row, error } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(reviewRowToApi(row as Parameters<typeof reviewRowToApi>[0]));
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

    const { data: review } = await supabase.from("reviews").select("user_id").eq("id", id).single();
    if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (review.user_id !== user.id && profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await supabase.from("review_photos").delete().eq("review_id", id);
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
