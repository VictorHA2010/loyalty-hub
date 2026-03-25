import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    discount: "5% descuento",
    features: ["Todo del plan mensual", "Soporte prioritario", "Habilitado White label"],
    icon: <Star size={24} />,
    popular: true,
  },
  {
    name: "Anual",
    price: "$4,309 MXN",
    priceId: "price_1TAeGOAmyaQPKkiAMSdISaU7",
    period: "/ año",
    discount: "10% descuento",
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
  const navigate = useNavigate();

  const [newBizName, setNewBizName] = useState("");
  const [newBizSlug, setNewBizSlug] = useState("");
  const [isCreatingBiz, setIsCreatingBiz] = useState(false);

  // 🔥 FIX 1: detectar correctamente si está activo
  const isActive = business?.is_active === true;

  // 🔥 FIX 2: refetch después del pago
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      toast.success("¡Pago completado! Activando tu suscripción...");
      setSearchParams({}, { replace: true });

      let attempts = 0;

      const interval = setInterval(async () => {
        attempts++;

        await refetchBusiness();

        if (attempts >= 10) clearInterval(interval);
      }, 3000);

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
      let currentBusinessSlug = business?.slug;

      if (!business) {
        if (!newBizName || !newBizSlug) {
          toast.error("Por favor ingresa el nombre y URL de tu nuevo negocio primero.");
          setLoadingPlan(null);
          return;
        }

        setIsCreatingBiz(true);
        const { data: newBiz, error: createError } = await supabase
          .from('businesses')
          .insert([
            { 
              name: newBizName, 
              slug: newBizSlug.toLowerCase().trim().replace(/\s+/g, '-'), 
              owner_id: session.user.id,
              is_active: false
            }
          ])
          .select()
          .single();

        if (createError) {
          if (createError.code === '23505') throw new Error("Esta URL (slug) ya está en uso. Elige otra.");
          throw createError;
        }

        currentBusinessId = newBiz.id;
        currentBusinessSlug = newBiz.slug;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          priceId,
          businessId: currentBusinessId,
          successUrl: `${window.location.origin}/admin/${currentBusinessSlug}/plans?payment=success`,
          cancelUrl: `${window.location.origin}/admin/${currentBusinessSlug}/plans?payment=cancelled`,
        },
      });

      if (error) throw error;
      if (data?.url) window.location.href = data.url;

    } catch (err: any) {
      toast.error(err.message || "Error al procesar");
    } finally {
      setLoadingPlan(null);
      setIsCreatingBiz(false);
    }
  };

  return (
    <AppLayout role="admin">
      <div className="max-w-5xl mx-auto py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">Lleva tu negocio al siguiente nivel</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {business ? `Gestiona la suscripción de ${business.name}` : "Crea tu programa de lealtad en minutos"}
          </p>
        </div>

        {!business && (
          <Card className="mb-10 border-aqua-200 bg-aqua-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="text-aqua-600" /> 
                Datos de tu nuevo negocio
              </CardTitle>
              <CardDescription>Antes de elegir un plan, dinos cómo se llamará tu negocio.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre del Negocio</Label>
                <Input 
                  placeholder="Ej: Barbería Pro" 
                  value={newBizName} 
                  onChange={(e) => setNewBizName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>URL Personalizada (Slug)</Label>
                <div className="flex items-center">
                  <span className="bg-muted px-3 py-2 border border-r-0 rounded-l-md text-xs">loyaltyhub.com/b/</span>
                  <Input 
                    className="rounded-l-none" 
                    placeholder="mi-negocio" 
                    value={newBizSlug}
                    onChange={(e) => setNewBizSlug(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card key={plan.priceId} className={plan.popular ? "ring-2 ring-primary scale-105" : ""}>
              <CardHeader className="text-center">
                <div className="text-primary mb-2 flex justify-center">{plan.icon}</div>
                <CardTitle>{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground"> {plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check size={14} className="text-green-500" /> {f}
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={plan.popular ? "default" : "outline"}
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