import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star, LogOut, Shield } from 'lucide-react';

const PLANS = [
  {
    name: "Mensual",
    price: "$399 MXN",
    period: "/ mes",
    features: ["Acceso completo", "Soporte por email", "White Label básico"],
    icon: <Zap size={24} />,
    popular: false,
  },
  {
    name: "Semestral",
    price: "$2,274 MXN",
    period: "/ 6 meses",
    discount: "5% descuento",
    features: ["Todo del plan mensual", "Soporte prioritario", "White Label completo"],
    icon: <Star size={24} />,
    popular: true,
  },
  {
    name: "Anual",
    price: "$4,309 MXN",
    period: "/ año",
    discount: "10% descuento",
    features: ["Todo del plan semestral", "Soporte 24/7", "Clientes ilimitados", "Multisucursal"],
    icon: <Crown size={24} />,
    popular: false,
  },
];

const PlansOverview = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
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
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-extrabold text-foreground">Elige tu plan</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Para comenzar a usar la plataforma, contacta a nuestro equipo para activar tu suscripción.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={`relative transition-all ${
                  plan.popular ? 'border-primary shadow-lg scale-[1.02]' : 'border-border'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-3 ${
                    plan.popular ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                  }`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.discount && (
                    <Badge variant="secondary" className="mx-auto w-fit mt-1">{plan.discount}</Badge>
                  )}
                  <CardDescription>
                    <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground"> {plan.period}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                        <Check size={16} className="text-primary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              ¿Listo para comenzar? Contacta al administrador de la plataforma para activar tu plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlansOverview;
