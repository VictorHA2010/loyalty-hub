ALTER TABLE public.business_members
ADD CONSTRAINT business_members_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;