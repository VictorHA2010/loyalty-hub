import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    name: "Mensual",
    price: "$399 MXN",
    priceId: "price_1TAeEaAmyaQPKkiAErJomvJz",
    period: "/ mes",
    features: ["Acceso completo", "Soporte por email", "Hasta 500 clientes"],
    icon: <Zap size={24} />,
    popular: false,
  },
  {
    name: "Semestral",
    price: "$2,274 MXN",
    priceId: "price_1TAeFwAmyaQPKkiAqZsYILm6",
    period: "/ 6 meses",
    discount: "5% descuento",
    features: ["Todo del plan mensual", "Soporte prioritario", "Hasta 2,000 clientes", "Reportes avanzados"],
    icon: <Star size={24} />,
    popular: true,
  },
  {
    name: "Anual",
    price: "$4,309 MXN",
    priceId: "price_1TAeGOAmyaQPKkiAMSdISaU7",
    period: "/ año",
    discount: "10% descuento",
    features: ["Todo del plan semestral", "Soporte 24/7", "Clientes ilimitados", "Marca blanca", "API acceso"],
    icon: <Crown size={24} />,
    popular: false,
  },
];

const SubscriptionPlans = () => {
  const { session } = useAuth();
  const { business, refetchBusiness } = useBusiness();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Detect payment success and refetch business data
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast.success("¡Pago completado! Activando tu suscripción...");
      // Remove query param
      setSearchParams({}, { replace: true });
      // Poll for webhook update (may take a few seconds)
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        refetchBusiness();
        if (attempts >= 10) clearInterval(interval);
      }, 3000);
      return () => clearInterval(interval);
    }
    if (searchParams.get("payment") === "cancelled") {
      toast.error("Pago cancelado");
      setSearchParams({}, { replace: true });
    }
  }, []);

  const handleSubscribe = async (priceId: string) => {
    if (!business || !session) return;

    setLoadingPlan(priceId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceId,
          businessId: business.id,
          successUrl: `${window.location.origin}/admin/${business.slug}/plans?payment=success`,
          cancelUrl: `${window.location.origin}/admin/${business.slug}/plans?payment=cancelled`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No se recibió URL de pago");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error("Error al iniciar el pago: " + (err.message || "Intenta de nuevo"));
    } finally {
      setLoadingPlan(null);
    }
  };

  const isActive = business?.is_active;

  return (
    <AppLayout role="admin">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground">Planes de Suscripción</h1>
          <p className="text-muted-foreground mt-2">
            Elige el plan que mejor se adapte a tu negocio
          </p>
          {isActive && (
            <Badge className="mt-3 bg-primary/10 text-primary border-primary/20">
              <Check size={14} className="mr-1" /> Tu suscripción está activa
            </Badge>
          )}
          {!isActive && (
            <Badge variant="destructive" className="mt-3">
              Tu suscripción no está activa — selecciona un plan para continuar
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.priceId}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                plan.popular ? "ring-2 ring-primary shadow-lg scale-[1.02]" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                  Popular
                </div>
              )}
              {plan.discount && (
                <div className="absolute top-0 left-0 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-br-lg">
                  {plan.discount}
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 text-primary">
                  {plan.icon}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check size={16} className="text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.priceId)}
                  disabled={loadingPlan !== null || isActive === true}
                >
                  {loadingPlan === plan.priceId ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : isActive ? (
                    "Suscripción activa"
                  ) : (
                    "Suscribirse"
                  )}
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
