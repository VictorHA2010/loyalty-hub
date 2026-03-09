
-- 1. Add 'active' column to businesses
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- 2. Create business_members table
CREATE TABLE IF NOT EXISTS public.business_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('business_admin', 'staff')),
  status text NOT NULL CHECK (status IN ('invited', 'active', 'inactive')) DEFAULT 'active',
  invited_by uuid NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, user_id)
);

ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;

-- RLS for business_members
CREATE POLICY "Platform admins can manage all business_members"
  ON public.business_members FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Business admins can manage own business members"
  ON public.business_members FOR ALL TO authenticated
  USING (public.has_business_role(auth.uid(), business_id, 'business_admin'::app_role));

CREATE POLICY "Members can view own business members"
  ON public.business_members FOR SELECT TO authenticated
  USING (business_id IN (SELECT public.get_user_business_ids(auth.uid())));

CREATE POLICY "Users can view own membership"
  ON public.business_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 3. Make business_id nullable in user_roles for platform_admin
ALTER TABLE public.user_roles ALTER COLUMN business_id DROP NOT NULL;

-- 4. Drop old unique constraint and add new one
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_business_id_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_business_id_role_key UNIQUE (user_id, business_id, role);

-- 5. Ensure the trigger for new users exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
