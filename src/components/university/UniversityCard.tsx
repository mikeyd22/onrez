import Link from "next/link";
import type { University } from "@/types";
import { cn } from "@/lib/utils";

interface UniversityCardProps {
  university: University;
  className?: string;
}

export function UniversityCard({ university, className }: UniversityCardProps) {
  const coverUrl = university.coverImageUrl || "/images/placeholder-listing.jpg";

  return (
    <Link
      href={`/university/${university.slug}`}
      className={cn("group block", className)}
    >
      <div className="relative overflow-hidden rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
          <img
            src={coverUrl}
            alt={university.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-medium px-2.5 py-1 rounded-full text-gray-700">
            {university.listingCount ?? 0} listings
          </span>
        </div>
        <div className="bg-white p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
            {university.name}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">{university.city}, Ontario</p>
        </div>
      </div>
    </Link>
  );
}
