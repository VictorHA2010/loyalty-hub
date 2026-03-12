ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#66C2A5',
  ADD COLUMN IF NOT EXISTS banner_image text DEFAULT NULL;