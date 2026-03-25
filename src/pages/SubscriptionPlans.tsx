import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Crown, Zap, Star, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    name: "Mensual",
    price: "$399 MXN",
    priceId: "price_1TAeEaAmyaQPKkiAErJomvJz",
    period: "/ mes",
    features: ["Acceso completo", "Soporte por email", "Habilitado White Label basico"],
    icon: <Zap size={24} />,
    popular: false,
  },
  {
    name: "Semestral",
    price: "$2,274 MXN",
    priceId: "price_1TAeFwAmyaQPKkiAqZsYILm6",
    period: "/ 6 meses",
    features: ["Todo del plan mensual", "Soporte prioritario", "Habilitado White label"],
    icon: <Star size={24} />,
    popular: true,
  },
  {
    name: "Anual",
    price: "$4,309 MXN",
    priceId: "price_1TAeGOAmyaQPKkiAMSdISaU7",
    period: "/ año",
    features: ["Todo del plan semestral", "Soporte 24/7", "Clientes ilimitados", "Multisurcursal"],
    icon: <Crown size={24} />,
    popular: false,
  },
];

const SubscriptionPlans = () => {
  const { session } = useAuth();
  const { business, refetchBusiness } = useBusiness();

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [newBizName, setNewBizName] = useState("");
  const [newBizSlug, setNewBizSlug] = useState("");

  // 🔥 FIX REAL: detección robusta
  const isActive = !!business?.is_active;

  // 🔥 DEBUG (NO BORRES)
  console.log("BUSINESS ACTUAL:", business);
  console.log("IS ACTIVE:", business?.is_active);

  // 🔥 REFRESH FUERTE después del pago
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast.success("¡Pago completado! Activando tu suscripción...");
      setSearchParams({}, { replace: true });

      let attempts = 0;

      const interval = setInterval(async () => {
        attempts++;

        const { data } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", business?.id)
          .single();

        console.log("REFETCH DB:", data);

        await refetchBusiness();

        if (data?.is_active === true) {
          console.log("🔥 YA ACTIVO, DETENIENDO POLLING");
          clearInterval(interval);
        }

        if (attempts >= 10) clearInterval(interval);

      }, 3000);

      return () => clearInterval(interval);
    }
  }, [searchParams, business?.id]);

  const handleSubscribe = async (priceId: string) => {
    if (!session) {
      toast.error("Debes iniciar sesión");
      return;
    }

    setLoadingPlan(priceId);

    try {
      let currentBusinessId = business?.id;
      let currentBusinessSlug = business?.slug;

      if (!business) {
        if (!newBizName || !newBizSlug) {
          toast.error("Ingresa los datos del negocio");
          setLoadingPlan(null);
          return;
        }

        const { data: newBiz } = await supabase
          .from("businesses")
          .insert({
            name: newBizName,
            slug: newBizSlug.toLowerCase().replace(/\s+/g, "-"),
            owner_id: session.user.id,
            is_active: false,
          })
          .select()
          .single();

        currentBusinessId = newBiz.id;
        currentBusinessSlug = newBiz.slug;
      }

      const { data } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceId,
          businessId: currentBusinessId,
          successUrl: `${window.location.origin}/admin/${currentBusinessSlug}/plans?payment=success`,
          cancelUrl: `${window.location.origin}/admin/${currentBusinessSlug}/plans`,
        },
      });

      if (data?.url) window.location.href = data.url;

    } catch (err: any) {
      toast.error(err.message || "Error");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <AppLayout role="admin">
      <div className="max-w-5xl mx-auto py-10">

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Lleva tu negocio al siguiente nivel</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {business ? `Gestiona ${business.name}` : "Crea tu programa"}
          </p>
        </div>

        {!business && (
          <Card className="mb-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 /> Nuevo negocio
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <Input placeholder="Nombre" value={newBizName} onChange={(e) => setNewBizName(e.target.value)} />
              <Input placeholder="slug" value={newBizSlug} onChange={(e) => setNewBizSlug(e.target.value)} />
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card key={plan.priceId}>
              <CardHeader className="text-center">
                <div className="flex justify-center">{plan.icon}</div>
                <CardTitle>{plan.name}</CardTitle>
                <div className="text-2xl font-bold">{plan.price}</div>
              </CardHeader>

              <CardContent>
                <ul className="mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check size={14} /> {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  disabled={loadingPlan !== null || isActive}
                  onClick={() => handleSubscribe(plan.priceId)}
                >
                  {loadingPlan === plan.priceId
                    ? <Loader2 className="animate-spin" />
                    : isActive
                    ? "Activo"
                    : "Elegir Plan"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </AppLayout>
  );
};

export default SubscriptionPlans;