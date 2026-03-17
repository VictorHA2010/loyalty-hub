import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserBusinesses } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Shield, LogOut, RefreshCw, CheckCircle2, Clock } from 'lucide-react';

const ActivationPending = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { refetch, isRefetching } = useUserBusinesses();
  const [checking, setChecking] = useState(false);

  const handleRetry = async () => {
    setChecking(true);
    const { data } = await refetch();
    if (data && data.length > 0) {
      // Business assigned! Clear flag and go to select
      localStorage.removeItem('loyaltyhub_payment_completed');
      navigate('/select-business');
    }
    setChecking(false);
  };

  const handleSignOut = async () => {
    localStorage.removeItem('loyaltyhub_payment_completed');
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-primary" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">¡Pago recibido correctamente!</h1>
          <p className="text-muted-foreground">
            Estamos configurando tu negocio. Tu cuenta será activada pronto por nuestro equipo.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-3 text-left">
            <Clock size={18} className="text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              Un administrador de la plataforma asignará tu negocio en breve. Este proceso puede tardar unos minutos.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            disabled={checking || isRefetching}
            className="w-full h-11 font-semibold"
          >
            {checking || isRefetching ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw size={16} className="mr-2" />
                Verificar estado
              </>
            )}
          </Button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground font-medium"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivationPending;
