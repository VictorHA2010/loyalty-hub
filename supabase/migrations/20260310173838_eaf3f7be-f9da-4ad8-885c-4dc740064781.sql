
-- 1. Create loyalty_settings table
CREATE TABLE public.loyalty_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  base_points_per_purchase integer NOT NULL DEFAULT 1,
  free_bonus_points integer NOT NULL DEFAULT 0,
  membership_points_multiplier numeric NOT NULL DEFAULT 1,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);

ALTER TABLE public.loyalty_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business admins can manage loyalty settings" ON public.loyalty_settings
  FOR ALL TO authenticated
  USING (has_business_role(auth.uid(), business_id, 'business_admin'::app_role) OR is_platform_admin(auth.uid()));

CREATE POLICY "Members can view loyalty settings" ON public.loyalty_settings
  FOR SELECT TO authenticated
  USING (business_id IN (SELECT get_user_business_ids(auth.uid()) AS get_user_business_ids) OR is_platform_admin(auth.uid()));

-- 2. Add Plus membership columns to memberships table
ALTER TABLE public.memberships 
  ADD COLUMN IF NOT EXISTS is_plus boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS points_multiplier numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bonus_points integer NOT NULL DEFAULT 0;
