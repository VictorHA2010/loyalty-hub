ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS banner_title text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS banner_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS banner_link text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS banner_active boolean NOT NULL DEFAULT false;