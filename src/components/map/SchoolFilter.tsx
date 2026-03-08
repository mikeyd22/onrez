"use client";

import type { University } from "@/types";
import { cn } from "@/lib/utils";

interface SchoolFilterProps {
  universities: University[];
  value: string;
  onChange: (slug: string) => void;
  onFlyTo?: (lat: number, lng: number, zoom: number) => void;
  className?: string;
}

export function SchoolFilter({
  universities,
  value,
  onChange,
  onFlyTo,
  className,
}: SchoolFilterProps) {
  const handleChange = (slug: string) => {
    onChange(slug);
    if (slug && onFlyTo) {
      const u = universities.find((x) => x.slug === slug);
      if (u) onFlyTo(u.latitude, u.longitude, 14);
    }
  };

  return (
    <select
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      className={cn(
        "rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-text shadow-md focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 transition-colors min-w-[180px]",
        className
      )}
    >
      <option value="">All Universities</option>
      {universities.map((u) => (
        <option key={u.id} value={u.slug}>
          {u.name}
        </option>
      ))}
    </select>
  );
}
