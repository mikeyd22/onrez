/** Database row shapes (snake_case as in Supabase). Used by API routes. */
export interface UniversityRow {
  id: string;
  name: string;
  slug: string;
  city: string;
  province: string | null;
  latitude: number;
  longitude: number;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  created_at: string;
}

export interface ListingRow {
  id: string;
  title: string | null;
  description: string | null;
  address: string;
  city: string | null;
  latitude: number;
  longitude: number;
  price_per_month: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string | null;
  amenities: string[];
  available_from: string | null;
  available_to: string | null;
  university_id: string | null;
  owner_id: string | null;
  is_active: boolean;
  avg_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  residency_status: string | null;
  last_stayed_month: number | null;
  last_stayed_year: number | null;
}

export interface ListingPhotoRow {
  id: string;
  listing_id: string;
  url: string;
  alt_text: string | null;
  display_order: number;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  avatar_icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  university_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookmarkRow {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
}

export interface UniversityReviewRow {
  id: string;
  university_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewPhotoRow {
  id: string;
  review_id: string;
  listing_id: string;
  user_id: string;
  url: string;
  display_order: number;
  created_at: string;
}
