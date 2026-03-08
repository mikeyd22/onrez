"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ListingGalleryProps {
  images: string[];
  title: string;
  className?: string;
}

export function ListingGallery({
  images,
  title,
  className,
}: ListingGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const mainImage = images[0] ?? "https://placehold.co/800x500";
  const thumbnails = images.slice(1, 5);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl overflow-hidden">
        <div className="md:col-span-2 relative aspect-[16/10] bg-gray-100 rounded-l-xl overflow-hidden">
          <Image
            src={mainImage}
            alt={title}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:row-span-2">
          {thumbnails.slice(0, 4).map((src, i) => (
            <div
              key={i}
              className="relative aspect-[16/10] md:aspect-square bg-gray-100 rounded-lg overflow-hidden"
            >
              <Image
                src={src}
                alt={`${title} ${i + 2}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setLightboxIndex(0);
          setLightboxOpen(true);
        }}
        className="text-sm font-medium text-primary hover:underline"
      >
        Show all photos
      </button>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white p-2 rounded-full hover:bg-white/10"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[lightboxIndex] ?? mainImage}
              alt={title}
              width={800}
              height={500}
              className="object-contain max-h-[90vh] w-auto mx-auto"
              unoptimized
            />
            {images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      i === lightboxIndex ? "bg-white" : "bg-white/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
