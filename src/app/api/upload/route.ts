import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const BUCKET = "listing-photos";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function validateFile(file: File): string | null {
  if (file.size > MAX_SIZE) {
    return `File ${file.name} exceeds 5MB`;
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return file.type
      ? `Invalid type for ${file.name}: ${file.type}. Use JPEG, PNG, or WebP.`
      : `Could not detect file type for ${file.name}. Use JPEG, PNG, or WebP (iPhone HEIC is not supported).`;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const listingId = request.nextUrl.searchParams.get("listing_id");
    const reviewId = request.nextUrl.searchParams.get("review_id");

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    if (!files.length) return NextResponse.json({ error: "No files" }, { status: 400 });

    for (const file of files) {
      const msg = validateFile(file);
      if (msg) return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (reviewId) {
      if (!listingId) {
        return NextResponse.json({ error: "listing_id required with review_id" }, { status: 400 });
      }
      const { data: review, error: reviewErr } = await supabase
        .from("reviews")
        .select("id, user_id, listing_id")
        .eq("id", reviewId)
        .single();
      if (reviewErr || !review) {
        return NextResponse.json({ error: "Review not found" }, { status: 404 });
      }
      if (review.user_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (review.listing_id !== listingId) {
        return NextResponse.json({ error: "Review does not belong to this listing" }, { status: 400 });
      }

      const { data: orderRow } = await supabase
        .from("review_photos")
        .select("display_order")
        .eq("review_id", reviewId)
        .order("display_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      let nextOrder = (orderRow?.display_order ?? -1) + 1;

      const urls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `reviews/${user.id}/${reviewId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const buf = Buffer.from(await file.arrayBuffer());
        const { error } = await supabase.storage.from(BUCKET).upload(path, buf, {
          contentType: file.type,
          upsert: false,
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
        urls.push(publicUrl);

        const { error: insertError } = await supabase.from("review_photos").insert({
          review_id: reviewId,
          listing_id: listingId,
          user_id: user.id,
          url: publicUrl,
          display_order: nextOrder,
        });
        if (insertError) {
          return NextResponse.json(
            { error: insertError.message || "Failed to save review photo" },
            { status: 500 }
          );
        }
        nextOrder += 1;
      }

      return NextResponse.json({ urls });
    }

    if (!listingId) return NextResponse.json({ error: "listing_id required" }, { status: 400 });

    const { data: listing, error: listingErr } = await supabase
      .from("listings")
      .select("owner_id")
      .eq("id", listingId)
      .single();
    if (listingErr || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.owner_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const urls: string[] = [];
    for (const file of files) {
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

    const { error: insertError } = await supabase.from("listing_photos").insert(
      urls.map((url, i) => ({
        listing_id: listingId,
        url,
        display_order: i,
      }))
    );
    if (insertError) {
      return NextResponse.json(
        { error: insertError.message || "Failed to save photo records" },
        { status: 500 }
      );
    }

    return NextResponse.json({ urls });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
