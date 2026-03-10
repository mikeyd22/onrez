"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadScript } from "@react-google-maps/api";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AddressAutocomplete } from "@/components/forms/AddressAutocomplete";
import type { PropertyType } from "@/types";

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "basement", label: "Basement" },
  { value: "room", label: "Room" },
  { value: "studio", label: "Studio" },
];

const AMENITY_OPTIONS = [
  "Wifi",
  "Laundry (in-unit)",
  "Laundry (shared)",
  "Parking",
  "Gym",
  "AC",
  "Furnished",
  "Pets allowed",
  "Utilities included",
  "Dishwasher",
  "Balcony",
  "Basement",
];

const RESIDENCY_OPTIONS = [
  { value: "current", label: "Currently living here" },
  { value: "last_stayed", label: "Last stayed" },
  { value: "visited", label: "Visited / toured only" },
] as const;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

interface UniversityOption {
  id: string;
  name: string;
  slug: string;
}

interface ListingFormProps {
  universities: UniversityOption[];
  /** When false, show plain address input instead of Google Autocomplete (e.g. when script failed to load). */
  useAddressAutocomplete?: boolean;
  existingListing?: {
    id: string;
    title: string | null;
    description: string | null;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    price_per_month: number;
    bedrooms: number;
    bathrooms: number;
    property_type: string | null;
    amenities: string[];
    available_from: string | null;
    university_id: string | null;
    residency_status: string | null;
    last_stayed_month: number | null;
    last_stayed_year: number | null;
  } | null;
}

function ListingFormInner({ universities, useAddressAutocomplete = true, existingListing = null }: ListingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialUniversitySlug = existingListing ? undefined : (searchParams.get("university") ?? undefined);
  const initialUniversityId = initialUniversitySlug
    ? universities.find((u) => u.slug === initialUniversitySlug)?.id ?? ""
    : existingListing?.university_id ?? "";

  const [description, setDescription] = useState(existingListing?.description ?? "");
  const [address, setAddress] = useState(existingListing?.address ?? "");
  const [city, setCity] = useState(existingListing?.city ?? ""); // from address autocomplete only; not shown as separate field
  const [latitude, setLatitude] = useState(existingListing?.latitude ?? 43.47);
  const [longitude, setLongitude] = useState(existingListing?.longitude ?? -80.54);
  const [pricePerMonth, setPricePerMonth] = useState(existingListing?.price_per_month ?? 1000);
  const [bedrooms, setBedrooms] = useState(existingListing?.bedrooms ?? 1);
  const [bathrooms, setBathrooms] = useState(existingListing?.bathrooms ?? 1);
  const [propertyType, setPropertyType] = useState<PropertyType>(
    (existingListing?.property_type as PropertyType) ?? "apartment"
  );
  const [amenities, setAmenities] = useState<string[]>(existingListing?.amenities ?? []);
  const [residencyStatus, setResidencyStatus] = useState<"current" | "last_stayed" | "visited">(
    (existingListing?.residency_status as "current" | "last_stayed" | "visited") ?? "current"
  );
  const [lastStayedMonth, setLastStayedMonth] = useState(existingListing?.last_stayed_month ?? new Date().getMonth() + 1);
  const [lastStayedYear, setLastStayedYear] = useState(existingListing?.last_stayed_year ?? new Date().getFullYear());
  const [universityId, setUniversityId] = useState((initialUniversityId || existingListing?.university_id) ?? "");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const handleAddressSelect = useCallback(
    (result: { address: string; city: string; latitude: number; longitude: number }) => {
      setAddress(result.address);
      setCity(result.city);
      setLatitude(result.latitude);
      setLongitude(result.longitude);
    },
    []
  );

  const toggleAmenity = (a: string) => {
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!address?.trim()) {
      setError("Address is required.");
      return;
    }
    if (pricePerMonth == null || pricePerMonth < 1) {
      setError("Price is required and must be at least $1.");
      return;
    }
    if (bedrooms == null || bathrooms == null) {
      setError("Bedrooms and bathrooms are required.");
      return;
    }
    if (!propertyType) {
      setError("Property type is required.");
      return;
    }
    if (!residencyStatus) {
      setError("Living status is required.");
      return;
    }
    if (!universityId?.trim()) {
      setError("Please select your university.");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const universitySlug = universityId ? universities.find((u) => u.id === universityId)?.slug ?? null : null;
      const payload = {
        title: address,
        description: description || null,
        address,
        city: city || null,
        latitude,
        longitude,
        pricePerMonth,
        bedrooms,
        bathrooms,
        propertyType,
        amenities,
        universitySlug,
        residencyStatus,
        lastStayedMonth: residencyStatus === "last_stayed" ? lastStayedMonth : null,
        lastStayedYear: residencyStatus === "last_stayed" ? lastStayedYear : null,
      };

      if (existingListing) {
        const res = await fetch(`/api/listings/${existingListing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        router.push(`/listing/${existingListing.id}`);
        router.refresh();
      } else {
        const res = await fetch("/api/listings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, imageUrls: [] }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const listingId = data.id;

        for (let i = 0; i < photos.length; i++) {
          const file = photos[i];
          const path = `${user.id}/${listingId}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("listing-photos")
            .upload(path, file);
          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("listing-photos")
              .getPublicUrl(path);
            await supabase.from("listing_photos").insert({
              listing_id: listingId,
              url: publicUrl,
              display_order: i,
            });
          }
        }

        router.push(`/listing/${listingId}`);
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create listing"
      );
    } finally {
      setLoading(false);
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length + photos.length > 10) {
      setError("Maximum 10 photos allowed.");
      return;
    }
    setPhotos((prev) => prev.concat(files));
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPhotoPreviews((prev) => prev.concat(newPreviews));
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-6 rounded-xl border border-border bg-white p-6"
    >
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
          {error}
        </p>
      )}

      <div>
        <Label htmlFor="address">Address *</Label>
        {useAddressAutocomplete ? (
          <div className="mt-1">
            <AddressAutocomplete
              id="address"
              onSelect={handleAddressSelect}
              onInputChange={(value) => setAddress(value)}
              defaultValue={address}
              placeholder="Start typing an address..."
            />
          </div>
        ) : (
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="mt-1"
            placeholder="Street address"
          />
        )}
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Describe the place — what's it like living here?"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="price">Price per month ($) *</Label>
        <Input
          id="price"
          type="number"
          min={1}
          value={pricePerMonth}
          onChange={(e) => setPricePerMonth(Number(e.target.value))}
          required
          placeholder="1200"
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bedrooms">Bedrooms *</Label>
          <select
            id="bedrooms"
            value={bedrooms}
            onChange={(e) => setBedrooms(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n === 5 ? "5+" : n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="bathrooms">Bathrooms *</Label>
          <select
            id="bathrooms"
            value={bathrooms}
            onChange={(e) => setBathrooms(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          >
            {[1, 2, 3].map((n) => (
              <option key={n} value={n}>
                {n === 3 ? "3+" : n}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="propertyType">Property type *</Label>
        <select
          id="propertyType"
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value as PropertyType)}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
        >
          {PROPERTY_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="text-sm font-medium text-dark-text mb-2">Amenities (optional)</p>
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((a) => (
            <label key={a} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={amenities.includes(a)}
                onChange={() => toggleAmenity(a)}
                className="rounded border-border"
              />
              <span className="text-sm">{a}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-dark-text mb-2">
          What&apos;s your living status at this address? *
        </p>
        <div className="space-y-2">
          {RESIDENCY_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="radio"
                name="residency"
                value={value}
                checked={residencyStatus === value}
                onChange={() =>
                  setResidencyStatus(value as "current" | "last_stayed" | "visited")
                }
                className="border-border"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
        {residencyStatus === "last_stayed" && (
          <div className="mt-3 flex flex-wrap gap-3">
            <div>
              <Label className="text-xs">Month</Label>
              <select
                value={lastStayedMonth}
                onChange={(e) => setLastStayedMonth(Number(e.target.value))}
                className="ml-1 rounded-md border border-border px-2 py-1.5 text-sm"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Year</Label>
              <select
                value={lastStayedYear}
                onChange={(e) => setLastStayedYear(Number(e.target.value))}
                className="ml-1 rounded-md border border-border px-2 py-1.5 text-sm"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="university">University *</Label>
        <select
          id="university"
          value={universityId}
          onChange={(e) => setUniversityId(e.target.value)}
          className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
          required
        >
          <option value="">Select your University</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {!existingListing && (
        <div>
          <Label>Photos (optional, max 10)</Label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handlePhotoChange}
            className="mt-1"
          />
          {photoPreviews.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {photoPreviews.map((url, i) => (
                <div key={i} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${i + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {existingListing ? "Update Listing" : "Create Listing"}
      </Button>
    </form>
  );
}

export function ListingForm(props: ListingFormProps) {
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const [scriptError, setScriptError] = useState(false);
  const useAutocomplete = !!googleMapsKey && !scriptError;

  if (!googleMapsKey || scriptError) {
    return <ListingFormInner {...props} useAddressAutocomplete={false} />;
  }

  return (
    <LoadScript
      googleMapsApiKey={googleMapsKey}
      libraries={GOOGLE_MAPS_LIBRARIES}
      loadingElement={
        <div className="min-h-[200px] flex items-center justify-center text-medium-text">
          Loading address search…
        </div>
      }
      onError={() => setScriptError(true)}
    >
      <ListingFormInner {...props} useAddressAutocomplete={useAutocomplete} />
    </LoadScript>
  );
}
