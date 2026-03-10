
-- Allow anyone (including anon) to read active businesses by slug for public landing pages
CREATE POLICY "Anyone can view active businesses"
ON public.businesses
FOR SELECT
TO anon, authenticated
USING (active = true);
