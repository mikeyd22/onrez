import Image from "next/image";
import type { University } from "@/types";
import { cn } from "@/lib/utils";

interface UniversityHeroProps {
  university: University;
  className?: string;
}

export function UniversityHero({ university, className }: UniversityHeroProps) {
  return (
    <div
      className={cn(
        "relative w-full h-64 sm:h-80 rounded-b-2xl overflow-hidden",
        className
      )}
    >
      <Image
        src={university.coverImageUrl}
        alt={university.name}
        fill
        className="object-cover"
        priority
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
        <h1 className="text-3xl sm:text-4xl font-bold">{university.name}</h1>
        <p className="text-lg text-white/90 mt-1">{university.city}</p>
        <p className="mt-4 text-white/90 max-w-2xl">{university.description}</p>
      </div>
    </div>
  );
}
