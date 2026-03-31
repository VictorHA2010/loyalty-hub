const handleSubscribe = async (priceId: string) => {
  if (!session) {
    toast.error("Debes iniciar sesión");
    return;
  }

  setLoadingPlan(priceId);

  try {
    let currentBusinessId = business?.id;

    // 🔥 SI NO HAY NEGOCIO → CREARLO BIEN
    if (!currentBusinessId) {
      if (!newBizName || !newBizSlug) {
        toast.error("Completa los datos del negocio");
        return;
      }

      const { data: newBiz, error } = await supabase
        .from("businesses")
        .insert({
          name: newBizName,
          slug: newBizSlug,
          is_active: false,
        })
        .select()
        .single();

      if (error || !newBiz) throw error;

      await supabase.from("user_roles").insert({
        user_id: session.user.id,
        business_id: newBiz.id,
        role: "business_admin",
      });

      currentBusinessId = newBiz.id;
    }

    // 🔥 AQUÍ ESTÁ EL FIX
    const { data, error } = await supabase.functions.invoke(
      "create-checkout-session",
      {
        body: {
          priceId,
          businessId: currentBusinessId,
          successUrl: `${window.location.origin}/subscription-plans?payment=success`,
          cancelUrl: `${window.location.origin}/subscription-plans`,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (error) throw error;

    if (data?.url) {
      window.location.href = data.url;
    }

  } catch (err: any) {
    console.error(err);
    toast.error("Error al iniciar pago");
  } finally {
    setLoadingPlan(null);
  }
};

export default SubscriptionPlans;