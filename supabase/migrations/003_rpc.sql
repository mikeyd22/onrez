-- ============================================
-- RPC functions for map bounds and nearby
-- ============================================

CREATE OR REPLACE FUNCTION listings_in_bounds(
  min_lat DOUBLE PRECISION,
  max_lat DOUBLE PRECISION,
  min_lng DOUBLE PRECISION,
  max_lng DOUBLE PRECISION
)
RETURNS SETOF listings AS $$
  SELECT * FROM listings
  WHERE is_active = true
    AND latitude BETWEEN min_lat AND max_lat
    AND longitude BETWEEN min_lng AND max_lng;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION listings_near_university(
  uni_lat DOUBLE PRECISION,
  uni_lng DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000
)
RETURNS SETOF listings AS $$
  SELECT * FROM listings
  WHERE is_active = true
    AND ST_DWithin(
      location,
      ST_Point(uni_lng, uni_lat)::geography,
      radius_meters
    )
  ORDER BY avg_rating DESC;
$$ LANGUAGE sql STABLE;
