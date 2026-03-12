CREATE POLICY "Staff can view customer profiles via customer_businesses"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT cb.user_id
    FROM public.customer_businesses cb
    WHERE cb.business_id IN (
      SELECT get_user_business_ids(auth.uid())
    )
  )
);