
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;
