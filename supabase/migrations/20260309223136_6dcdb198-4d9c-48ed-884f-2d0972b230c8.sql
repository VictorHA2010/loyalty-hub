
-- =============================================
-- 1. DROP ALL OLD TABLES AND FUNCTIONS
-- =============================================
DROP TABLE IF EXISTS public.legal_acceptances CASCADE;
DROP TABLE IF EXISTS public.legal_documents CASCADE;
DROP TABLE IF EXISTS public.coupon_redemptions CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.redemptions CASCADE;
DROP TABLE IF EXISTS public.rewards CASCADE;
DROP TABLE IF EXISTS public.memberships CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.points_ledger CASCADE;
DROP TABLE IF EXISTS public.organization_settings CASCADE;
DROP TABLE IF EXISTS public.organization_users CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.customer_businesses CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS public.has_org_role CASCADE;
DROP FUNCTION IF EXISTS public.is_org_member CASCADE;
DROP FUNCTION IF EXISTS public.get_user_org_ids CASCADE;

-- Drop old enum and recreate
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('platform_admin', 'business_admin', 'staff', 'customer');

-- =============================================
-- 2. UPDATE PROFILES TABLE (add email if missing)
-- =============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- =============================================
-- 3. CREATE NEW TABLES
-- =============================================

-- BUSINESSES
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- LOCATIONS
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- USER_ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- CUSTOMER_BUSINESSES
CREATE TABLE public.customer_businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);
ALTER TABLE public.customer_businesses ENABLE ROW LEVEL SECURITY;

-- POINTS_LEDGER
CREATE TABLE public.points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  location_id uuid REFERENCES public.locations(id),
  points integer NOT NULL,
  type text NOT NULL CHECK (type IN ('earn','redeem','adjust')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;

-- REWARDS
CREATE TABLE public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- REDEMPTIONS
CREATE TABLE public.redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed','canceled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- MEMBERSHIPS
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive','active','past_due','canceled')),
  plan_name text,
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- COUPONS
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','amount')),
  discount_value numeric NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(business_id, code)
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- COUPON_REDEMPTIONS
CREATE TABLE public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- REFERRALS
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  referrer_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES public.profiles(id),
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','signed_up','qualified','rewarded')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- LEGAL_DOCUMENTS
CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('terms','privacy')),
  version text NOT NULL,
  content text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- LEGAL_ACCEPTANCES
CREATE TABLE public.legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.legal_documents(id) ON DELETE CASCADE,
  accepted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. SECURITY DEFINER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'platform_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_business_role(_user_id uuid, _business_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND business_id = _business_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_business_member(_user_id uuid, _business_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND business_id = _business_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_business_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT business_id FROM public.user_roles WHERE user_id = _user_id
$$;

-- =============================================
-- 5. UPDATE handle_new_user TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, qr_token)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    gen_random_uuid()::text
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    qr_token = COALESCE(profiles.qr_token, EXCLUDED.qr_token);
  RETURN NEW;
END;
$function$;

-- Recreate trigger (drop if exists first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 6. RLS POLICIES
-- =============================================

-- PROFILES
-- (policies already exist from before, drop and recreate)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view org member profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Staff can view business member profiles" ON public.profiles FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT ur.user_id FROM user_roles ur
      WHERE ur.business_id IN (SELECT get_user_business_ids(auth.uid()))
    )
    OR is_platform_admin(auth.uid())
  );

-- BUSINESSES
CREATE POLICY "Members can view their businesses" ON public.businesses FOR SELECT TO authenticated
  USING (id IN (SELECT get_user_business_ids(auth.uid())) OR is_platform_admin(auth.uid()));
CREATE POLICY "Platform admins can manage businesses" ON public.businesses FOR ALL TO authenticated
  USING (is_platform_admin(auth.uid()));
CREATE POLICY "Business admins can update own business" ON public.businesses FOR UPDATE TO authenticated
  USING (has_business_role(auth.uid(), id, 'business_admin'));

-- LOCATIONS
CREATE POLICY "Members can view business locations" ON public.locations FOR SELECT TO authenticated
  USING (business_id IN (SELECT get_user_business_ids(auth.uid())) OR is_platform_admin(auth.uid()));
CREATE POLICY "Business admins can manage locations" ON public.locations FOR ALL TO authenticated
  USING (has_business_role(auth.uid(), business_id, 'business_admin') OR is_platform_admin(auth.uid()));

-- USER_ROLES
CREATE POLICY "Members can view business roles" ON public.user_roles FOR SELECT TO authenticated
  USING (business_id IN (SELECT get_user_business_ids(auth.uid())) OR is_platform_admin(auth.uid()));
CREATE POLICY "Business admins can manage roles" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (has_business_role(auth.uid(), business_id, 'business_admin') OR is_platform_admin(auth.uid()));
CREATE POLICY "Business admins can update roles" ON public.user_roles FOR UPDATE TO authenticated
  USING (has_business_role(auth.uid(), business_id, 'business_admin') OR is_platform_admin(auth.uid()));
CREATE POLICY "Business admins can delete roles" ON public.user_roles FOR DELETE TO authenticated
  USING (has_business_role(auth.uid(), business_id, 'business_admin') OR is_platform_admin(auth.uid()));

-- CUSTOMER_BUSINESSES
CREATE POLICY "Users can view own memberships" ON public.customer_businesses FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_platform_admin(auth.uid()));
CREATE POLICY "Users can join businesses" ON public.customer_businesses FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Business admins can view customers" ON public.customer_businesses FOR SELECT TO authenticated
  USING (business_id IN (SELECT get_user_business_ids(auth.uid())));

-- POINTS_LEDGER (append-only: no update, no delete)
CREATE POLICY "Users can view own points" ON public.points_ledger FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Staff can view business points" ON public.points_ledger FOR SELECT TO authenticated
  USING (business_id IN (SELECT get_user_business_ids(auth.uid())) OR is_platform_admin(auth.uid()));
CREATE POLICY "Staff can insert points" ON public.points_ledger FOR INSERT TO authenticated
  WITH CHECK (
    has_business_role(auth.uid(), business_id, 'staff')
    OR has_business_role(auth.uid(), business_id, 'business_admin')
    OR is_platform_admin(auth.uid())
    OR user_id = auth.uid()
  );

-- REWARDS
CREATE POLICY "Members can view business rewards" ON public.rewards FOR SELECT TO authenticated
  USING (business_id IN (SELECT get_user_business_ids(auth.uid())) OR is_platform_admin(auth.uid()));
CREATE POLICY "Business admins can manage rewards" ON public.rewards FOR INSERT TO authenticated
  WITH CHECK (has_business_role(auth.uid(), business_id, 'business_admin') OR is_platform_admin(auth.uid()));
CREATE POLICY "Business admins can update rewards" ON public.rewards FOR UPDATE TO authenticated
  USING (has_business_role(auth.uid(), business_id, 'business_admin') OR is_platform_admin(auth.uid()));
CREATE POLICY "Business admins can delete rewards" ON public.rewards FOR DELETE TO authenticated
  USING (has_business_role(auth.uid(), business_id, 'business_admin') OR is_platform_admin(auth.uid()));

-- REDEMPTIONS
CREATE POLICY "Users can view own redemptions" ON public.redemptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Staff can view business redemptions" ON public.redemptions FOR SELECT TO authenticated
  USING (business_id IN (SELECT get_user_business_ids(auth.uid())) OR is_platform_admin(auth.uid()));
CREATE POLICY "Users can create redemptions" ON public.redemptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_business_member(auth.uid(), business_id));
CREATE POLICY "Staff can update redemptions" ON public.redemptions FOR UPDATE TO authenticated
  USING (
    has_business_role(auth.uid(), business_id, 'staff')
    OR has_business_role(auth.uid(), business_id, 'business_admin')
    OR is_platform_admin(auth.uid())
  );

-- MEMBERSHIPS
CREATE POLICY "Users can view own memberships" ON public.memberships FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Business admins can manage memberships" ON public.memberships FOR ALL TO authenticated
  USING (has_business_role(auth.uid(), business_id, 'business_admin') OR is_platform_admin(auth.uid()));

-- COUPONS
CREATE POLICY "Members can view business coupons" ON public.coupons FOR SELECT TO authenticated
  USING (business_id IN (SELECT get_user_business_ids(auth.uid())) OR is_platform_admin(auth.uid()));
CREATE POLICY "Business admins can manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (has_business_role(auth.uid(), business_id, 'business_admin') OR is_platform_admin(auth.uid()));

-- COUPON_REDEMPTIONS
CREATE POLICY "Users can view own coupon redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can redeem coupons" ON public.coupon_redemptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Staff can view business coupon redemptions" ON public.coupon_redemptions FOR SELECT TO authenticated
  USING (business_id IN (SELECT get_user_business_ids(auth.uid())) OR is_platform_admin(auth.uid()));

-- REFERRALS
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT TO authenticated
  USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());
CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (referrer_user_id = auth.uid());

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Staff can insert notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    has_business_role(auth.uid(), business_id, 'staff')
    OR has_business_role(auth.uid(), business_id, 'business_admin')
    OR is_platform_admin(auth.uid())
  );

-- LEGAL_DOCUMENTS
CREATE POLICY "Anyone can view active legal documents" ON public.legal_documents FOR SELECT TO authenticated
  USING (active = true OR is_platform_admin(auth.uid()));
CREATE POLICY "Business admins can manage legal documents" ON public.legal_documents FOR ALL TO authenticated
  USING (has_business_role(auth.uid(), business_id, 'business_admin') OR is_platform_admin(auth.uid()));

-- LEGAL_ACCEPTANCES
CREATE POLICY "Users can view own acceptances" ON public.legal_acceptances FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can create acceptances" ON public.legal_acceptances FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
