import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { universityRowToApi } from "@/lib/api-transform";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: rows, error } = await supabase
      .from("universities")
      .select("*")
      .order("name");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const universities = (rows ?? []).map((r: unknown) =>
      universityRowToApi({ ...(r as Record<string, unknown>), listing_count: 0, avg_rent: 0 } as Parameters<typeof universityRowToApi>[0])
    );
    return NextResponse.json({ universities });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
