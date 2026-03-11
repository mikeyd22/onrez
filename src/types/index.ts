export interface University {
  id: string;
  name: string;
  slug: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
  logoUrl: string;
  coverImageUrl: string;
  /** Defaults to 0 when empty (e.g. new data from DB). */
  listingCount?: number;
  /** Defaults to 0 when empty. */
  avgRent?: number;
}

export type PropertyType =
  | "apartment"
  | "house"
  | "condo"
  | "basement"
  | "room"
  | "studio";

export type ResidencyStatus = "current" | "last_stayed" | "visited";

export interface Listing {
  id: string;
  /** Display name: use address when title is empty (address IS the listing name). */
  title: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  pricePerMonth: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: PropertyType;
  amenities: string[];
  images: string[];
  universitySlug: string;
  avgRating?: number;
  reviewCount?: number;
  availableFrom: string;
  description: string;
  residencyStatus?: ResidencyStatus | null;
  lastStayedMonth?: number | null;
  lastStayedYear?: number | null;
  /** Only set when loading "my listings" (owner view). */
  isActive?: boolean;
}

export interface ReviewPhoto {
  id: string;
  reviewId: string;
  listingId: string;
  userId: string;
  url: string;
  displayOrder: number;
  createdAt: string;
}

export interface Review {
  id: string;
  listingId: string;
  /** Random avatar icon path for anonymous display (e.g. /images/avatars/avatar-1.png). */
  avatarIcon: string;
  rating: number;
  comment: string;
  createdAt: string;
  /** Photos attached to this review (when loaded with review_photos). */
  reviewPhotos?: ReviewPhoto[];
}

export interface NearbyPlace {
  id: string;
  name: string;
  type: "bus_stop" | "restaurant" | "shopping";
  latitude: number;
  longitude: number;
}

export interface UniversityReview {
  id: string;
  universityId: string;
  userName: string;
  avatarUrl: string;
  rating: number;
  comment: string;
  createdAt: string;
}
