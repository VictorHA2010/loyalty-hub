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
    features: ["Acceso completo", "Soporte por email", "White Label básico"],
    icon: <Zap size={24} />,
    popular: false,
  },
  {
    name: "Semestral",
    price: "$2,274 MXN",
    priceId: "price_1TAeFwAmyaQPKkiAqZsYILm6",
    period: "/ 6 meses",
    features: ["Todo del mensual", "Soporte prioritario"],
    icon: <Star size={24} />,
    popular: true,
  },
  {
    name: "Anual",
    price: "$4,309 MXN",
    priceId: "price_1TAeGOAmyaQPKkiAMSdISaU7",
    period: "/ año",
    features: ["Todo del semestral", "Soporte 24/7"],
    icon: <Crown size={24} />,
    popular: false,
  },
];

const SubscriptionPlans = () => {
  const { session } = useAuth();
  const { business, loading, refetchBusiness } = useBusiness();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [newBizName, setNewBizName] = useState("");
  const [newBizSlug, setNewBizSlug] = useState("");

  // 🔥 PROTECCIÓN TOTAL (EVITA PANTALLA BLANCA)
  if (loading) {
    return (
      <AppLayout role="admin">
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const isActive = business?.is_active === true;

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast.success("Pago exitoso, activando...");

      setSearchParams({}, { replace: true });

      let tries = 0;
      const interval = setInterval(async () => {
        tries++;
        await refetchBusiness();
        if (tries >= 10) clearInterval(interval);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, []);

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

        // 🔥 CRÍTICO: crear relación
        await supabase.from("user_roles").insert({
          user_id: session.user.id,
          business_id: newBiz.id,
          role: "business_admin",
        });

        currentBusinessId = newBiz.id;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceId,
          businessId: currentBusinessId,
          successUrl: `${window.location.origin}/subscription-plans?payment=success`,
          cancelUrl: `${window.location.origin}/subscription-plans`,
        },
      });

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

  return (
    <AppLayout role="admin">
      <div className="max-w-5xl mx-auto py-10">

        {!business && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Crear negocio</CardTitle>
              <CardDescription>Antes de pagar</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Input placeholder="Nombre" value={newBizName} onChange={(e) => setNewBizName(e.target.value)} />
              <Input placeholder="Slug" value={newBizSlug} onChange={(e) => setNewBizSlug(e.target.value)} />
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card key={plan.priceId}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-2xl font-bold">{plan.price}</p>

                <Button
                  className="w-full mt-4"
                  disabled={loadingPlan !== null || isActive}
                  onClick={() => handleSubscribe(plan.priceId)}
                >
                  {loadingPlan === plan.priceId
                    ? <Loader2 className="animate-spin" />
                    : isActive
                      ? "Activo"
                      : "Elegir plan"}
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