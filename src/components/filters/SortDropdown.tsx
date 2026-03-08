"use client";

import { cn } from "@/lib/utils";

export type SortOption =
  | "rating"
  | "price_asc"
  | "price_desc"
  | "reviews"
  | "newest";

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: "rating", label: "Top Rated" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "reviews", label: "Most Reviews" },
  { value: "newest", label: "Newest" },
];

interface SortDropdownProps {
  value: SortOption;
  onChange: (v: SortOption) => void;
  className?: string;
}

export function SortDropdown({ value, onChange, className }: SortDropdownProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortOption)}
      className={cn(
        "rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-text focus:outline-none focus:ring-2 focus:ring-primary",
        className
      )}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
