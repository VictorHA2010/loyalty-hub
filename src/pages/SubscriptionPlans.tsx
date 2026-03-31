const SubscriptionPlans = () => {

  const handleSubscribe = async (priceId: string) => {
    if (!session) {
      toast.error("Debes iniciar sesión");
      return;
    }

    setLoadingPlan(priceId);

    try {
      let currentBusinessId = business?.id;

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

      // 🔥 FIX REAL AQUÍ
      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            priceId,
            businessId: currentBusinessId,
            successUrl: `${window.location.origin}/subscription-plans?payment=success`,
            cancelUrl: `${window.location.origin}/subscription-plans`,
          },
        }
      );

      // ❌ NO rompemos el flujo
      if (error) {
        console.error("Supabase error:", error);
      }

      console.log("DATA:", data);

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("No se pudo generar el checkout");
      }

    } catch (err: any) {
      console.error(err);
      toast.error("Error al iniciar pago");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div>
      {/* TU UI AQUÍ */}
    </div>
  );
};

export default SubscriptionPlans;