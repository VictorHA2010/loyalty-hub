import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star, LogOut, Shield, Loader2, Eye, Monitor, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import DemoAdmin from './DemoAdmin';
import DemoCustomer from './DemoCustomer';

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
    discount: "5% descuento",
    features: ["Todo del plan mensual", "Soporte prioritario", "White Label completo"],
    icon: <Star size={24} />,
    popular: true,
  },
  {
    name: "Anual",
    price: "$4,309 MXN",
    priceId: "price_1TAeGOAmyaQPKkiAMSdISaU7",
    period: "/ año",
    discount: "10% descuento",
    features: ["Todo del plan semestral", "Soporte 24/7", "Clientes ilimitados", "Multisucursal"],
    icon: <Crown size={24} />,
    popular: false,
  },
];

const PAYMENT_FLAG = 'loyaltyhub_payment_completed';

const PlansOverview = () => {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [demoView, setDemoView] = useState<'admin' | 'customer' | null>(null);

  // Handle payment redirect
  const paymentStatus = searchParams.get('payment');
  if (paymentStatus === 'success') {
    localStorage.setItem(PAYMENT_FLAG, 'true');
    // Clear params and redirect to activation
    setSearchParams({}, { replace: true });
    navigate('/activation', { replace: true });
  }
  if (paymentStatus === 'cancelled') {
    toast.error('Pago cancelado');
    setSearchParams({}, { replace: true });
  }

  const handleSubscribe = async (priceId: string) => {
    if (!session) {
      toast.error('Debes iniciar sesión primero');
      navigate('/login');
      return;
    }

    setLoadingPlan(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          // No businessId — new user flow
          successUrl: `${window.location.origin}/plans?payment=success`,
          cancelUrl: `${window.location.origin}/plans?payment=cancelled`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error('Error al iniciar el pago: ' + (err.message || 'Intenta de nuevo'));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Demo overlays
  if (demoView === 'admin') return <DemoAdmin onClose={() => setDemoView(null)} />;
  if (demoView === 'customer') return <DemoCustomer onClose={() => setDemoView(null)} />;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Shield size={16} className="text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">LoyaltyHub</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl space-y-8">
          {/* Title */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-extrabold text-foreground">Elige tu plan</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Selecciona el plan ideal para tu negocio y empieza a fidelizar clientes hoy.
            </p>
          </div>

          {/* Demo buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => setDemoView('admin')}
              className="gap-2"
            >
              <Monitor size={16} />
              Vista Previa Admin
            </Button>
            <Button
              variant="outline"
              onClick={() => setDemoView('customer')}
              className="gap-2"
            >
              <Smartphone size={16} />
              Vista Previa Cliente
            </Button>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <Card
                key={plan.priceId}
                className={`relative overflow-hidden transition-all hover:shadow-lg ${
                  plan.popular ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : ''
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
                  <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3 ${
                    plan.popular ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                  }`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm"> {plan.period}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check size={16} className="text-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan.priceId)}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === plan.priceId ? (
                      <>
                        <Loader2 size={16} className="animate-spin mr-2" />
                        Procesando...
                      </>
                    ) : (
                      'Suscribirse'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansOverview;
