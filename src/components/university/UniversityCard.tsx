import Link from "next/link";
import Image from "next/image";
import type { University } from "@/types";
import { cn } from "@/lib/utils";

interface UniversityCardProps {
  university: University;
  className?: string;
}

export function UniversityCard({ university, className }: UniversityCardProps) {
  return (
    <Link
      href={`/university/${university.slug}`}
      className={cn(
        "group block rounded-xl bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        className
      )}
    >
      <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
        <Image
          src={university.coverImageUrl}
          alt={university.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-200"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 320px"
          unoptimized
        />
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-dark-text text-lg">{university.name}</h3>
        <p className="text-sm text-medium-text mt-1">{university.city}</p>
        <p className="text-sm text-medium-text mt-0.5">
          {university.listingCount ?? 0} listings
        </p>
      </div>
    </Link>
  );
}
