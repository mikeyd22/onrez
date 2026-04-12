/**
 * OnRez — CSV → Supabase Import Script
 *
 * Requires .env.local (same as seed script):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, IMPORT_LISTINGS_OWNER_ID
 *
 * Run:
 *   npx tsx scripts/import-listings.ts listings.csv
 *   npx tsx scripts/import-listings.ts listings.csv --dry-run
 */

import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import readline from "readline";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_OWNER_ID = process.env.IMPORT_LISTINGS_OWNER_ID?.trim();
const BATCH_SIZE = 50;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.local.example to .env.local and add your keys."
  );
  process.exit(1);
}
if (!ADMIN_OWNER_ID) {
  console.error("Missing IMPORT_LISTINGS_OWNER_ID (UUID of the user who should own imported listings).");
  process.exit(1);
}

const VALID_PROPERTY_TYPES = ["apartment", "house", "condo", "basement", "room", "studio"];
const VALID_RESIDENCY_STATUSES = ["current", "last_stayed", "visited"];
const DRY_RUN = process.argv.includes("--dry-run");
const CSV_FILE = process.argv.find((a) => a.endsWith(".csv"));

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

// ─── Types ────────────────────────────────────────────────────────────────────

interface CSVRow {
  title: string;
  address: string;
  city: string;
  latitude?: string;
  longitude?: string;
  price_per_month: string;
  bedrooms?: string;
  bathrooms?: string;
  property_type?: string;
  amenities?: string;
  available_from?: string;
  available_to?: string;
  university_slug?: string;
  residency_status?: string;
  last_stayed_month?: string;
  last_stayed_year?: string;
  description?: string;
  is_active?: string;
}

interface ListingInsert {
  title: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  price_per_month: number;
  bedrooms?: number;
  bathrooms?: number;
  property_type?: string;
  amenities?: string[];
  available_from?: string;
  available_to?: string;
  university_id?: string;
  owner_id?: string;
  residency_status?: string;
  last_stayed_month?: number;
  last_stayed_year?: number;
  description?: string;
  is_active: boolean;
}

interface RowError {
  row: number;
  field: string;
  reason: string;
}

// ─── Geocoding via Nominatim (free, no API key needed) ───────────────────────

async function geocode(address: string, city: string): Promise<{ lat: number; lng: number } | null> {
  const query = encodeURIComponent(`${address}, ${city}, Canada`);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "OnRez-Import-Script/1.0" },
    });
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

async function parseCSV(filePath: string): Promise<CSVRow[]> {
  const rows: CSVRow[] = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let headers: string[] = [];
  let isFirst = true;

  for await (const line of rl) {
    if (!line.trim()) continue;

    // Simple CSV parser (handles quoted fields with commas)
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (isFirst) {
      headers = values.map((h) => h.toLowerCase().trim());
      isFirst = false;
      continue;
    }

    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = values[i] ?? ""));
    rows.push(row as unknown as CSVRow);
  }

  return rows;
}

// ─── University slug → UUID lookup ───────────────────────────────────────────

async function loadUniversities(): Promise<Map<string, string>> {
  const { data, error } = await supabase.from("universities").select("id, slug");
  if (error) throw new Error(`Failed to load universities: ${error.message}`);
  const map = new Map<string, string>();
  for (const u of data ?? []) map.set(u.slug, u.id);
  return map;
}

// ─── Validate + transform a single row ───────────────────────────────────────

async function transformRow(
  row: CSVRow,
  rowNum: number,
  universities: Map<string, string>
): Promise<{ listing: ListingInsert | null; errors: RowError[] }> {
  const errors: RowError[] = [];

  // Required fields
  if (!row.title?.trim()) errors.push({ row: rowNum, field: "title", reason: "Required, missing" });
  if (!row.address?.trim()) errors.push({ row: rowNum, field: "address", reason: "Required, missing" });
  if (!row.city?.trim()) errors.push({ row: rowNum, field: "city", reason: "Required, missing" });
  if (!row.price_per_month?.trim()) errors.push({ row: rowNum, field: "price_per_month", reason: "Required, missing" });

  const price = parseInt(row.price_per_month);
  if (isNaN(price)) errors.push({ row: rowNum, field: "price_per_month", reason: `Not a valid integer: "${row.price_per_month}"` });

  // Property type
  if (row.property_type && !VALID_PROPERTY_TYPES.includes(row.property_type.toLowerCase())) {
    errors.push({ row: rowNum, field: "property_type", reason: `Must be one of: ${VALID_PROPERTY_TYPES.join(", ")}` });
  }

  // Residency status
  if (row.residency_status && !VALID_RESIDENCY_STATUSES.includes(row.residency_status.toLowerCase())) {
    errors.push({ row: rowNum, field: "residency_status", reason: `Must be one of: ${VALID_RESIDENCY_STATUSES.join(", ")}` });
  }

  // Dates
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (row.available_from && !dateRegex.test(row.available_from)) {
    errors.push({ row: rowNum, field: "available_from", reason: `Must be YYYY-MM-DD, got: "${row.available_from}"` });
  }
  if (row.available_to && !dateRegex.test(row.available_to)) {
    errors.push({ row: rowNum, field: "available_to", reason: `Must be YYYY-MM-DD, got: "${row.available_to}"` });
  }

  // University slug
  let university_id: string | undefined;
  if (row.university_slug?.trim()) {
    university_id = universities.get(row.university_slug.trim().toLowerCase());
    if (!university_id) {
      errors.push({ row: rowNum, field: "university_slug", reason: `Unknown slug: "${row.university_slug}"` });
    }
  }

  if (errors.length > 0) return { listing: null, errors };

  // Geocode if lat/lng missing
  let latitude = parseFloat(row.latitude ?? "");
  let longitude = parseFloat(row.longitude ?? "");

  if (isNaN(latitude) || isNaN(longitude)) {
    process.stdout.write(`  Row ${rowNum}: geocoding "${row.address}, ${row.city}"... `);
    const coords = await geocode(row.address, row.city);
    if (!coords) {
      console.log("❌ not found");
      return {
        listing: null,
        errors: [{ row: rowNum, field: "latitude/longitude", reason: "Geocoding failed — address not found" }],
      };
    }
    latitude = coords.lat;
    longitude = coords.lng;
    console.log(`✓ (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);

    // Nominatim rate limit: 1 req/sec
    await new Promise((r) => setTimeout(r, 1100));
  }

  const listing: ListingInsert = {
    title: row.title.trim(),
    address: row.address.trim(),
    city: row.city.trim(),
    latitude,
    longitude,
    price_per_month: price,
    bedrooms: row.bedrooms ? parseInt(row.bedrooms) : undefined,
    bathrooms: row.bathrooms ? parseInt(row.bathrooms) : undefined,
    property_type: row.property_type?.toLowerCase() || undefined,
    amenities: row.amenities ? row.amenities.split(",").map((a) => a.trim()).filter(Boolean) : undefined,
    available_from: row.available_from || undefined,
    available_to: row.available_to || undefined,
    university_id,
    owner_id: ADMIN_OWNER_ID,
    residency_status: row.residency_status?.toLowerCase() || undefined,
    last_stayed_month: row.last_stayed_month ? parseInt(row.last_stayed_month) : undefined,
    last_stayed_year: row.last_stayed_year ? parseInt(row.last_stayed_year) : undefined,
    description: row.description?.trim() || undefined,
    is_active: row.is_active?.toLowerCase() !== "false",
  };

  return { listing, errors: [] };
}

// ─── Batch insert ─────────────────────────────────────────────────────────────

async function insertBatch(listings: ListingInsert[], batchNum: number): Promise<number> {
  const { error, data } = await supabase.from("listings").insert(listings).select("id");
  if (error) {
    console.error(`  ❌ Batch ${batchNum} failed: ${error.message}`);
    return 0;
  }
  return data?.length ?? 0;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🏠 OnRez CSV → Supabase Importer\n");

  if (!CSV_FILE) {
    console.error("Usage: npx tsx scripts/import-listings.ts <file.csv> [--dry-run]");
    process.exit(1);
  }

  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌ File not found: ${CSV_FILE}`);
    process.exit(1);
  }

  if (DRY_RUN) console.log("🔍 DRY RUN MODE — no data will be inserted\n");

  // Load universities
  console.log("Loading universities from Supabase...");
  const universities = await loadUniversities();
  console.log(`  ✓ Found ${universities.size} universities: ${Array.from(universities.keys()).join(", ")}\n`);

  // Parse CSV
  console.log(`Parsing CSV: ${path.basename(CSV_FILE)}`);
  const rawRows = await parseCSV(CSV_FILE);
  console.log(`  ✓ ${rawRows.length} rows found\n`);

  // Validate + transform
  console.log("Validating and geocoding rows...");
  const listings: ListingInsert[] = [];
  const allErrors: RowError[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const { listing, errors } = await transformRow(rawRows[i], i + 2, universities); // +2 for header + 1-index
    if (listing) listings.push(listing);
    allErrors.push(...errors);
  }

  console.log(`\n✓ ${listings.length} rows valid`);
  if (allErrors.length > 0) {
    console.log(`⚠  ${allErrors.length} errors:\n`);
    allErrors.forEach((e) => console.log(`  Row ${e.row} [${e.field}]: ${e.reason}`));
  }

  if (listings.length === 0) {
    console.log("\nNo valid rows to insert. Exiting.");
    process.exit(0);
  }

  if (DRY_RUN) {
    console.log("\n✅ Dry run complete. Run without --dry-run to insert.");
    process.exit(0);
  }

  // Batch insert
  console.log(`\nInserting ${listings.length} listings in batches of ${BATCH_SIZE}...`);
  let totalInserted = 0;
  for (let i = 0; i < listings.length; i += BATCH_SIZE) {
    const batch = listings.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    process.stdout.write(`  Batch ${batchNum}: inserting ${batch.length} rows... `);
    const inserted = await insertBatch(batch, batchNum);
    totalInserted += inserted;
    console.log(`✓ ${inserted} inserted`);
  }

  console.log(`\n🎉 Done! ${totalInserted}/${listings.length} listings imported into Supabase.`);
  console.log("→ Verify in: Supabase Dashboard → Table Editor → listings\n");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
