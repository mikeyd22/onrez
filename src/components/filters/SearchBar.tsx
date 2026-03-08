"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { universityRowToApi } from "@/lib/api-transform";
import type { University } from "@/types";
import type { UniversityRow } from "@/lib/db-types";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  defaultUniversity?: string;
  defaultKeyword?: string;
  layout?: "hero" | "inline";
  className?: string;
}

export function SearchBar({
  defaultUniversity = "",
  defaultKeyword = "",
  layout = "hero",
  className,
}: SearchBarProps) {
  const router = useRouter();
  const [universities, setUniversities] = useState<University[]>([]);
  const [university, setUniversity] = useState(defaultUniversity);
  const [keyword, setKeyword] = useState(defaultKeyword);

  useEffect(() => {
    createClient()
      .from("universities")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (data) setUniversities(data.map((u) => universityRowToApi({ ...u, listing_count: 0, avg_rent: 0 } as UniversityRow & { listing_count: number; avg_rent: number })));
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (university) {
      router.push(`/map?university=${university}`);
    } else {
      router.push(keyword ? `/explore?q=${encodeURIComponent(keyword)}` : "/explore");
    }
  };

  const isHero = layout === "hero";

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex flex-col sm:flex-row gap-2 sm:gap-0 w-full",
        isHero && "bg-white rounded-xl shadow-md p-2 sm:p-1 border border-border",
        className
      )}
    >
      <select
        value={university}
        onChange={(e) => setUniversity(e.target.value)}
        className={cn(
          "rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-text focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 transition-colors",
          isHero ? "sm:rounded-r-none sm:border-r-0 sm:min-w-[180px]" : "sm:min-w-[160px]"
        )}
      >
        <option value="">All universities</option>
        {universities.map((u) => (
          <option key={u.id} value={u.slug}>
            {u.name}
          </option>
        ))}
      </select>
      <div className="flex flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-medium-text pointer-events-none" />
        <Input
          type="text"
          placeholder="Search by keyword..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className={cn(
            "pl-9 flex-1 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-400 transition-colors",
            isHero && "sm:rounded-none sm:border-r-0 border-border"
          )}
        />
      </div>
      <Button
        type="submit"
        className={cn(
          "bg-primary text-white shrink-0",
          isHero && "sm:rounded-l-none"
        )}
      >
        Search
      </Button>
    </form>
  );
}
