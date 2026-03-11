"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { ReviewPhoto } from "@/types";

interface PhotoLightboxProps {
  photos: { id: string; url: string }[];
  onClose: () => void;
  startIndex?: number;
}

export function PhotoLightbox({
  photos,
  onClose,
  startIndex = 0,
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  if (photos.length === 0) return null;

  const photo = photos[currentIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2"
        aria-label="Close"
      >
        <X className="w-8 h-8" />
      </button>

      <div className="absolute top-4 left-4 text-white/80 text-sm z-10">
        {currentIndex + 1} / {photos.length}
      </div>

      <img
        src={photo.url}
        alt=""
        className="max-w-[90vw] max-h-[85vh] object-contain"
      />

      {currentIndex > 0 && (
        <button
          type="button"
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
          aria-label="Previous"
        >
          <ChevronLeft className="w-10 h-10" />
        </button>
      )}

      {currentIndex < photos.length - 1 && (
        <button
          type="button"
          onClick={() => setCurrentIndex(currentIndex + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
          aria-label="Next"
        >
          <ChevronRight className="w-10 h-10" />
        </button>
      )}
    </div>
  );
}
