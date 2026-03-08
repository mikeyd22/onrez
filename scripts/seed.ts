/**
 * Seed script: populates Supabase with universities, listings, photos, and reviews.
 * Run: npm run seed
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional: Set SEED_OWNER_EMAIL to the email you used to sign up so seeded listings have you as owner.
 */

import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const seedOwnerEmailRaw = process.env.SEED_OWNER_EMAIL as string | undefined;
const seedOwnerEmail = seedOwnerEmailRaw?.trim() || undefined;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.local.example to .env.local and add your keys.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const UNIVERSITIES = [
  { name: "University of Waterloo", slug: "waterloo", city: "Waterloo", latitude: 43.4723, longitude: -80.5449, description: "Known for engineering, CS, and co-op programs.", logo_url: "https://placehold.co/80x80/3B5BDB/FFFFFF?text=UW", cover_image_url: "https://placehold.co/800x400/EEF2FF/3B5BDB?text=University+of+Waterloo" },
  { name: "University of Toronto", slug: "uoft", city: "Toronto", latitude: 43.6629, longitude: -79.3957, description: "Canada's top-ranked research university.", logo_url: "https://placehold.co/80x80/3B5BDB/FFFFFF?text=UofT", cover_image_url: "https://placehold.co/800x400/EEF2FF/3B5BDB?text=University+of+Toronto" },
  { name: "Western University", slug: "western", city: "London", latitude: 43.0096, longitude: -81.2737, description: "Research-intensive university in London, Ontario.", logo_url: "https://placehold.co/80x80/3B5BDB/FFFFFF?text=WU", cover_image_url: "https://placehold.co/800x400/EEF2FF/3B5BDB?text=Western+University" },
  { name: "McMaster University", slug: "mcmaster", city: "Hamilton", latitude: 43.2609, longitude: -79.9192, description: "Medical-doctoral university renowned for health sciences.", logo_url: "https://placehold.co/80x80/3B5BDB/FFFFFF?text=MAC", cover_image_url: "https://placehold.co/800x400/EEF2FF/3B5BDB?text=McMaster+University" },
  { name: "Queen's University", slug: "queens", city: "Kingston", latitude: 44.2253, longitude: -76.4951, description: "Historic university in Kingston with strong undergraduate programs.", logo_url: "https://placehold.co/80x80/3B5BDB/FFFFFF?text=QU", cover_image_url: "https://placehold.co/800x400/EEF2FF/3B5BDB?text=Queen%27s+University" },
  { name: "University of Ottawa", slug: "uottawa", city: "Ottawa", latitude: 45.4231, longitude: -75.6831, description: "World's largest bilingual university.", logo_url: "https://placehold.co/80x80/3B5BDB/FFFFFF?text=UO", cover_image_url: "https://placehold.co/800x400/EEF2FF/3B5BDB?text=University+of+Ottawa" },
  { name: "Toronto Metropolitan University", slug: "tmu", city: "Toronto", latitude: 43.6577, longitude: -79.3788, description: "Downtown Toronto university with applied programs.", logo_url: "https://placehold.co/80x80/3B5BDB/FFFFFF?text=TMU", cover_image_url: "https://placehold.co/800x400/EEF2FF/3B5BDB?text=Toronto+Metropolitan" },
  { name: "York University", slug: "york", city: "Toronto", latitude: 43.7735, longitude: -79.5019, description: "One of Canada's largest universities.", logo_url: "https://placehold.co/80x80/3B5BDB/FFFFFF?text=YU", cover_image_url: "https://placehold.co/800x400/EEF2FF/3B5BDB?text=York+University" },
  { name: "Wilfrid Laurier University", slug: "laurier", city: "Waterloo", latitude: 43.4738, longitude: -80.5275, description: "Mid-sized university known for business and music.", logo_url: "https://placehold.co/80x80/3B5BDB/FFFFFF?text=WLU", cover_image_url: "https://placehold.co/800x400/EEF2FF/3B5BDB?text=Wilfrid+Laurier" },
  { name: "University of Guelph", slug: "guelph", city: "Guelph", latitude: 43.5327, longitude: -80.2262, description: "Comprehensive university known for agriculture and vet medicine.", logo_url: "https://placehold.co/80x80/3B5BDB/FFFFFF?text=UG", cover_image_url: "https://placehold.co/800x400/EEF2FF/3B5BDB?text=University+of+Guelph" },
];

async function seed() {
  console.log("Clearing existing data...");
  await supabase.from("bookmarks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("listing_photos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("listings").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("universities").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("Inserting universities...");
  const { data: uniRows, error: uniErr } = await supabase.from("universities").insert(UNIVERSITIES).select("id, slug");
  if (uniErr) throw uniErr;
  const uniBySlug = new Map((uniRows ?? []).map((u) => [u.slug, u.id]));

  let ownerId: string | null = null;
  if (seedOwnerEmail) {
    const want = seedOwnerEmail.toLowerCase();
    const allUsers: { id: string; email?: string }[] = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.warn("Failed to list users for SEED_OWNER_EMAIL lookup:", error.message);
        break;
      }
      const users = data?.users ?? [];
      allUsers.push(...users);
      const total = (data as { total?: number })?.total ?? 0;
      if (users.length < perPage || allUsers.length >= total) break;
      page += 1;
    }
    const u = allUsers.find((x) => (x.email ?? "").toLowerCase() === want);
    ownerId = u?.id ?? null;
    if (ownerId) {
      console.log("Using SEED_OWNER_EMAIL: listings will be owned by", seedOwnerEmail);
    } else {
      console.warn("SEED_OWNER_EMAIL not set or user not found (looked for:", seedOwnerEmail, ", auth users:", allUsers.length, "). Listings will have owner_id = null.");
    }
  } else {
    console.warn("SEED_OWNER_EMAIL not set. Listings will have owner_id = null (schema must allow it).");
  }

  const listingsPayload = [
    { title: "Bright 2BR near UW Campus", address: "256 Lester St", city: "Waterloo", latitude: 43.471, longitude: -80.542, price_per_month: 1200, bedrooms: 2, bathrooms: 1, property_type: "apartment", amenities: ["Laundry", "Parking", "WiFi"], description: "Spacious two-bedroom within walking distance of UW.", available_from: "2025-05-01", university_id: uniBySlug.get("waterloo") },
    { title: "Cozy Studio on Columbia", address: "330 Columbia St W", city: "Waterloo", latitude: 43.469, longitude: -80.538, price_per_month: 950, bedrooms: 1, bathrooms: 1, property_type: "studio", amenities: ["WiFi", "Utilities included"], description: "Compact studio perfect for one person.", available_from: "2025-06-01", university_id: uniBySlug.get("waterloo") },
    { title: "3BR House with Backyard", address: "182 Westmount Rd E", city: "Waterloo", latitude: 43.466, longitude: -80.535, price_per_month: 2100, bedrooms: 3, bathrooms: 2, property_type: "house", amenities: ["Parking", "Laundry", "Backyard", "WiFi"], description: "Full house with yard, great for a group.", available_from: "2025-09-01", university_id: uniBySlug.get("waterloo") },
    { title: "Annex 2BR — Steps to UofT", address: "342 Brunswick Ave", city: "Toronto", latitude: 43.665, longitude: -79.398, price_per_month: 2200, bedrooms: 2, bathrooms: 1, property_type: "apartment", amenities: ["Laundry", "WiFi"], description: "Character apartment in the Annex.", available_from: "2025-06-01", university_id: uniBySlug.get("uoft") },
    { title: "Harbord Village Studio", address: "123 Harbord St", city: "Toronto", latitude: 43.662, longitude: -79.402, price_per_month: 1650, bedrooms: 1, bathrooms: 1, property_type: "studio", amenities: ["WiFi", "Laundry in building"], description: "Small but well-laid-out studio.", available_from: "2025-07-01", university_id: uniBySlug.get("uoft") },
    { title: "2BR near Western — Broughdale", address: "124 Broughdale Ave", city: "London", latitude: 43.008, longitude: -81.272, price_per_month: 1400, bedrooms: 2, bathrooms: 1, property_type: "apartment", amenities: ["Parking", "Laundry", "WiFi"], description: "Walking distance to Western.", available_from: "2025-05-01", university_id: uniBySlug.get("western") },
    { title: "Westdale 1BR — Near McMaster", address: "901 King St W", city: "Hamilton", latitude: 43.259, longitude: -79.918, price_per_month: 1100, bedrooms: 1, bathrooms: 1, property_type: "apartment", amenities: ["Laundry", "WiFi"], description: "Quiet building in Westdale.", available_from: "2025-06-01", university_id: uniBySlug.get("mcmaster") },
    { title: "Student House — University District", address: "42 Earl St", city: "Kingston", latitude: 44.224, longitude: -76.497, price_per_month: 750, bedrooms: 1, bathrooms: 1, property_type: "room", amenities: ["Laundry", "WiFi", "Furnished"], description: "Furnished room in a house full of Queen's students.", available_from: "2025-08-01", university_id: uniBySlug.get("queens") },
    { title: "Sandy Hill 1BR — uOttawa", address: "120 Henderson Ave", city: "Ottawa", latitude: 45.422, longitude: -75.682, price_per_month: 1250, bedrooms: 1, bathrooms: 1, property_type: "apartment", amenities: ["Laundry", "WiFi"], description: "Classic Sandy Hill apartment.", available_from: "2025-05-01", university_id: uniBySlug.get("uottawa") },
    { title: "Downtown Studio — Dundas Square", address: "280 Dundas St E", city: "Toronto", latitude: 43.656, longitude: -79.378, price_per_month: 1950, bedrooms: 1, bathrooms: 1, property_type: "studio", amenities: ["Gym", "Concierge", "WiFi"], description: "New condo steps from TMU.", available_from: "2025-06-15", university_id: uniBySlug.get("tmu") },
  ];

  const listingInserts = listingsPayload.map((l) => ({ ...l, owner_id: ownerId }));
  const { data: listingRows, error: listErr } = await supabase.from("listings").insert(listingInserts).select("id");
  if (listErr) throw listErr;
  const listingIds = (listingRows ?? []).map((r) => r.id);

  console.log("Inserting listing photos...");
  const photoInserts: { listing_id: string; url: string; display_order: number }[] = [];
  listingIds.forEach((lid, i) => {
    for (let j = 0; j < 3; j++) {
      photoInserts.push({
        listing_id: lid,
        url: `https://placehold.co/600x400/E2E8F0/64748B?text=Listing+${i + 1}+${j + 1}`,
        display_order: j,
      });
    }
  });
  await supabase.from("listing_photos").insert(photoInserts);

  console.log("Inserting reviews (skipped: need seed users). Add reviews via the app or create users and re-run with SEED_OWNER_EMAIL.");
  console.log("Seeded universities:", uniRows?.length ?? 0);
  console.log("Seeded listings:", listingIds.length);
  console.log("Seeded listing_photos:", photoInserts.length);
  console.log("Done.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
