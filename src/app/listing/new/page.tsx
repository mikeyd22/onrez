import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListingForm } from "@/components/listings/ListingForm";

export default async function NewListingPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: universities } = await supabase
    .from("universities")
    .select("id, name, slug")
    .order("name");

  return (
    <div className="min-h-screen bg-light-bg">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-dark-text">Post a Listing</h1>
        <p className="mt-2 text-medium-text">
          Add your rental for students to find.
        </p>
        <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-xl bg-gray-100" />}>
          <ListingForm universities={universities ?? []} />
        </Suspense>
      </div>
    </div>
  );
}
