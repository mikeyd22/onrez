-- Allow listings.city to be null (city is included in address)
ALTER TABLE listings ALTER COLUMN city DROP NOT NULL;
