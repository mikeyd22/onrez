"use client";

import { Bus, UtensilsCrossed, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapControlsProps {
  transit: boolean;
  food: boolean;
  shops: boolean;
  onTransit: (v: boolean) => void;
  onFood: (v: boolean) => void;
  onShops: (v: boolean) => void;
  className?: string;
}

export function MapControls({
  transit,
  food,
  shops,
  onTransit,
  onFood,
  onShops,
  className,
}: MapControlsProps) {
  const btn =
    "flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium shadow transition-all duration-200";
  const active = "bg-primary text-white border-primary";

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <button
        type="button"
        onClick={() => onTransit(!transit)}
        className={cn(btn, transit && active)}
      >
        <Bus className="h-4 w-4" />
        Transit
      </button>
      <button
        type="button"
        onClick={() => onFood(!food)}
        className={cn(btn, food && active)}
      >
        <UtensilsCrossed className="h-4 w-4" />
        Food
      </button>
      <button
        type="button"
        onClick={() => onShops(!shops)}
        className={cn(btn, shops && active)}
      >
        <ShoppingBag className="h-4 w-4" />
        Shops
      </button>
    </div>
  );
}
