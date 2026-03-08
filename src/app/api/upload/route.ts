import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const BUCKET = "listing-photos";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const listingId = request.nextUrl.searchParams.get("listing_id");
    if (!listingId) return NextResponse.json({ error: "listing_id required" }, { status: 400 });

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

    const urls: string[] = [];
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: `File ${file.name} exceeds 5MB` }, { status: 400 });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `Invalid type: ${file.type}` }, { status: 400 });
      }
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${listingId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const buf = Buffer.from(await file.arrayBuffer());
      const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
        contentType: file.type,
        upsert: false,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(publicUrl);
    }
    return NextResponse.json({ urls });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
