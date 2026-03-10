import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListingForm } from "@/components/listings/ListingForm";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: row } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!row || row.owner_id !== user.id) notFound();

  const { data: universities } = await supabase
    .from("universities")
    .select("id, name, slug")
    .order("name");

  const existingListing = {
    id: row.id,
    title: row.title,
    description: row.description,
    address: row.address,
    city: row.city ?? "",
    latitude: row.latitude,
    longitude: row.longitude,
    price_per_month: row.price_per_month,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    property_type: row.property_type,
    amenities: row.amenities ?? [],
    available_from: row.available_from,
    available_to: row.available_to,
    university_id: row.university_id,
    residency_status: row.residency_status,
    last_stayed_month: row.last_stayed_month,
    last_stayed_year: row.last_stayed_year,
  };

  return (
    <div className="min-h-screen bg-light-bg">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-dark-text">Edit Listing</h1>
        <p className="mt-2 text-medium-text">
          Update your listing details.
        </p>
        <ListingForm
          universities={universities ?? []}
          existingListing={existingListing}
        />
      </div>
    </div>
  );
}
