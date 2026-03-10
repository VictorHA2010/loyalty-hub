
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#f59e0b',
  ADD COLUMN IF NOT EXISTS welcome_message text DEFAULT 'Bienvenido a nuestro programa de lealtad',
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS business_type text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS custom_domain text;
