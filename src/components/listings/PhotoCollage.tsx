"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { PhotoLightbox } from "@/components/reviews/PhotoLightbox";

interface GalleryPhoto {
  id: string;
  url: string;
}

interface PhotoCollageProps {
  photos: GalleryPhoto[];
}

export function PhotoCollage({ photos }: PhotoCollageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const displayPhotos = photos.slice(0, 5);

  if (photos.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
        <div className="text-center">
          <Camera className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No photos yet — leave a review to add some!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] rounded-xl overflow-hidden">
        <div className="col-span-2 row-span-2 relative">
          <img
            src={displayPhotos[0]?.url}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        {displayPhotos.slice(1, 5).map((photo) => (
          <div key={photo.id} className="relative">
            <img
              src={photo.url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {displayPhotos.length < 5 &&
          Array.from({ length: 5 - displayPhotos.length }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-gray-100" />
          ))}
      </div>

      {photos.length > 0 && (
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="mt-3 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Show all photos ({photos.length})
        </button>
      )}

      {lightboxOpen && (
        <PhotoLightbox
          photos={photos}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
