
-- Create membership_plans catalog table
CREATE TABLE public.membership_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  points_multiplier NUMERIC NOT NULL DEFAULT 1,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  is_plus BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business admins can manage membership plans"
ON public.membership_plans
FOR ALL
TO authenticated
USING (has_business_role(auth.uid(), business_id, 'business_admin') OR is_platform_admin(auth.uid()))
WITH CHECK (has_business_role(auth.uid(), business_id, 'business_admin') OR is_platform_admin(auth.uid()));

CREATE POLICY "Members can view business membership plans"
ON public.membership_plans
FOR SELECT
TO authenticated
USING (
  business_id IN (SELECT get_user_business_ids(auth.uid()))
  OR is_platform_admin(auth.uid())
);

-- Customers can also view plans of businesses they belong to
CREATE POLICY "Customers can view membership plans"
ON public.membership_plans
FOR SELECT
TO authenticated
USING (
  business_id IN (
    SELECT cb.business_id FROM public.customer_businesses cb WHERE cb.user_id = auth.uid()
  )
);

-- Add plan_id to memberships table
ALTER TABLE public.memberships ADD COLUMN plan_id UUID REFERENCES public.membership_plans(id) ON DELETE SET NULL;
