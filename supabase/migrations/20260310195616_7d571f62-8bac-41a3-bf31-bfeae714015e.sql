
-- Drop all existing restrictive policies on business_members
DROP POLICY IF EXISTS "Business admins can manage own business members" ON public.business_members;
DROP POLICY IF EXISTS "Members can view own business members" ON public.business_members;
DROP POLICY IF EXISTS "Platform admins can manage all business_members" ON public.business_members;
DROP POLICY IF EXISTS "Users can view own membership" ON public.business_members;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Business admins can manage own business members"
ON public.business_members
FOR ALL
TO authenticated
USING (has_business_role(auth.uid(), business_id, 'business_admin'::app_role))
WITH CHECK (has_business_role(auth.uid(), business_id, 'business_admin'::app_role));

CREATE POLICY "Members can view own business members"
ON public.business_members
FOR SELECT
TO authenticated
USING (business_id IN (SELECT get_user_business_ids(auth.uid()) AS get_user_business_ids));

CREATE POLICY "Platform admins can manage all business_members"
ON public.business_members
FOR ALL
TO authenticated
USING (is_platform_admin(auth.uid()))
WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "Users can view own membership"
ON public.business_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
