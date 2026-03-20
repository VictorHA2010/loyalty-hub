CREATE OR REPLACE FUNCTION public.find_profile_by_email(_email text)
RETURNS TABLE(id uuid, full_name text, email text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('platform_admin', 'business_admin')
  ) THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT p.id, p.full_name, p.email
    FROM public.profiles p
    WHERE lower(p.email) = lower(_email)
    LIMIT 1;
END;
$$;