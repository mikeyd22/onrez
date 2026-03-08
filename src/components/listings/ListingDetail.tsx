import type { Listing } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { StarRating } from "./StarRating";
import { ListingGallery } from "./ListingGallery";
import {
  BedDouble,
  Bath,
  MapPin,
  Wifi,
  Car,
} from "lucide-react";
import { cn } from "@/lib/utils";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="h-4 w-4" />,
  Parking: <Car className="h-4 w-4" />,
  Laundry: <Bath className="h-4 w-4" />,
  Gym: <span className="text-sm font-bold">Gym</span>,
  "Bike storage": <span className="text-sm">Bike</span>,
  "Utilities included": <span className="text-sm">Util</span>,
  Backyard: <span className="text-sm">Yard</span>,
  Concierge: <span className="text-sm">Concierge</span>,
  "Private entrance": <span className="text-sm">Private</span>,
  Furnished: <span className="text-sm">Furn</span>,
};

function getAmenityIcon(name: string) {
  return AMENITY_ICONS[name] ?? <span className="text-sm">{name.slice(0, 2)}</span>;
}

interface ListingDetailProps {
  listing: Listing;
  universityName?: string;
  className?: string;
}

export function ListingDetail({
  listing,
  universityName,
  className,
}: ListingDetailProps) {
  const residencyLabel =
    listing.residencyStatus === "current"
      ? "Currently living here"
      : listing.residencyStatus === "last_stayed" && listing.lastStayedMonth != null && listing.lastStayedYear != null
        ? `Last stayed: ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][listing.lastStayedMonth - 1]} ${listing.lastStayedYear}`
        : listing.residencyStatus === "visited"
          ? "Visited"
          : null;

  return (
    <div className={cn("space-y-8", className)}>
      <ListingGallery images={listing.images} title={listing.address} />

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-dark-text truncate">
            {listing.address}
          </h1>
          <p className="text-medium-text mt-1 flex items-center gap-1">
            <MapPin className="h-4 w-4 shrink-0" />
            {listing.city} · {listing.propertyType}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-medium text-dark-text capitalize">
              {listing.propertyType}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-medium text-dark-text">
              <BedDouble className="h-4 w-4" />
              {listing.bedrooms} bed{listing.bedrooms !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-medium text-dark-text">
              <Bath className="h-4 w-4" />
              {listing.bathrooms} bath{listing.bathrooms !== 1 ? "s" : ""}
            </span>
            {residencyLabel && (
              <span
                className={cn(
                  "inline-flex rounded-lg px-2.5 py-1 text-sm font-medium",
                  listing.residencyStatus === "current"
                    ? "bg-green-100 text-green-800"
                    : listing.residencyStatus === "last_stayed"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-gray-50 text-gray-600"
                )}
              >
                {residencyLabel}
              </span>
            )}
          </div>
        </div>
        <div className="md:text-right shrink-0">
          <p className="text-2xl font-bold text-dark-text">
            {formatPrice(listing.pricePerMonth)}/mo
          </p>
          {listing.availableFrom && (
            <p className="text-sm text-medium-text mt-1">
              Available from {formatDate(listing.availableFrom)}
            </p>
          )}
          <div className="mt-2">
            <StarRating
              rating={listing.avgRating ?? 0}
              reviewCount={listing.reviewCount ?? 0}
            />
          </div>
        </div>
      </div>

      {listing.description && (
        <div>
          <h2 className="text-lg font-semibold text-dark-text mb-2">
            Description
          </h2>
          <p className="text-medium-text leading-relaxed">{listing.description}</p>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-dark-text mb-3">
          Amenities
        </h2>
        <div className="flex flex-wrap gap-2">
          {listing.amenities.map((a) => (
            <span
              key={a}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-text"
            >
              {getAmenityIcon(a)}
              {a}
            </span>
          ))}
        </div>
      </div>

      {universityName && (
        <p className="text-sm text-medium-text">
          Near <span className="font-medium text-dark-text">{universityName}</span>
        </p>
      )}
    </div>
  );
}
