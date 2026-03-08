"use client";

import { useRef } from "react";
import { UniversityReviewCard } from "./UniversityReviewCard";
import { UniversityReviewForm } from "./UniversityReviewForm";
import type { UniversityReview } from "@/types";

interface UniversityReviewSectionProps {
  universitySlug: string;
  universityName: string;
  reviews: UniversityReview[];
  userReview: UniversityReview | null;
  isLoggedIn: boolean;
}

export function UniversityReviewSection({
  universitySlug,
  universityName,
  reviews,
  userReview,
  isLoggedIn,
}: UniversityReviewSectionProps) {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-dark-text">
          Reviews about living near {universityName}
        </h2>
        <button
          type="button"
          onClick={scrollToForm}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          {userReview ? "Edit Your Review" : "+ Add Your Review"}
        </button>
      </div>
      <p className="text-medium-text mb-6">
        What&apos;s it like living near {universityName}?
      </p>
      <div className="space-y-4">
        {reviews.map((review) => (
          <UniversityReviewCard key={review.id} review={review} />
        ))}
      </div>
      <div ref={formRef} className="mt-8">
        <UniversityReviewForm
          universitySlug={universitySlug}
          universityName={universityName}
          existingReview={userReview}
          isLoggedIn={isLoggedIn}
          onReviewSubmitted={() => window.location.reload()}
        />
      </div>
    </section>
  );
}
