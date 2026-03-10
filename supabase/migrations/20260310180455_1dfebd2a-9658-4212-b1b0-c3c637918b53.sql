
-- Security definer function so business_admin can find a user by email
-- Returns profile id and full_name, or null if not found
CREATE OR REPLACE FUNCTION public.find_profile_by_email(_email text)
RETURNS TABLE(id uuid, full_name text, email text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.id, p.full_name, p.email
  FROM public.profiles p
  WHERE lower(p.email) = lower(_email)
  LIMIT 1;
$$;
