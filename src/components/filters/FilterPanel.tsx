"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import type { PropertyType } from "@/types";
import { cn } from "@/lib/utils";

const PROPERTY_TYPES: { value: PropertyType | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "basement", label: "Basement" },
  { value: "room", label: "Room" },
  { value: "studio", label: "Studio" },
];

export interface FilterState {
  priceMin: number;
  priceMax: number;
  bedrooms: number | null;
  propertyType: PropertyType | "";
}

const DEFAULT_FILTERS: FilterState = {
  priceMin: 0,
  priceMax: 2500,
  bedrooms: null,
  propertyType: "",
};

interface FilterPanelProps {
  value: FilterState;
  onChange: (f: FilterState) => void;
  onClear: () => void;
  className?: string;
}

export function FilterPanel({
  value,
  onChange,
  onClear,
  className,
}: FilterPanelProps) {
  const hasActive =
    value.priceMin > 0 ||
    value.priceMax < 2500 ||
    value.bedrooms != null ||
    value.propertyType !== "";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl border border-border",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-medium-text">Price:</span>
        <input
          type="number"
          min={0}
          max={value.priceMax}
          value={value.priceMin || ""}
          onChange={(e) =>
            onChange({
              ...value,
              priceMin: parseInt(e.target.value, 10) || 0,
            })
          }
          placeholder="Min"
          className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm"
        />
        <span className="text-medium-text">—</span>
        <input
          type="number"
          min={value.priceMin}
          max={5000}
          value={value.priceMax || ""}
          onChange={(e) =>
            onChange({
              ...value,
              priceMax: parseInt(e.target.value, 10) || 2500,
            })
          }
          placeholder="Max"
          className="w-20 rounded-lg border border-border px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-medium-text">Bedrooms:</span>
        {[null, 1, 2, 3, 4].map((n) => (
          <button
            key={n ?? "any"}
            type="button"
            onClick={() => onChange({ ...value, bedrooms: n })}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium border border-border transition-all",
              value.bedrooms === n
                ? "bg-primary text-white border-primary"
                : "bg-white text-medium-text hover:bg-gray-50"
            )}
          >
            {n == null ? "Any" : n === 4 ? "4+" : n}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-medium-text">Type:</span>
        <select
          value={value.propertyType}
          onChange={(e) =>
            onChange({
              ...value,
              propertyType: e.target.value as PropertyType | "",
            })
          }
          className="rounded-lg border border-border px-3 py-1.5 text-sm bg-white"
        >
          {PROPERTY_TYPES.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {hasActive && (
        <button
          type="button"
          onClick={onClear}
          className="text-sm font-medium text-primary hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

export { DEFAULT_FILTERS };
