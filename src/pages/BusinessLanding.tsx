import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';
import { useEffect } from 'react';

const BusinessLanding = () => {
  const { business, loading, error } = useBusiness();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is logged in and business loaded, redirect to app
    if (user && business) {
      navigate(`/b/${business.slug}/app`, { replace: true });
    }
  }, [user, business, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Building2 size={48} className="mx-auto text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Negocio no encontrado</h1>
          <p className="text-sm text-muted-foreground">La URL del negocio no es válida.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        {business.logo_url ? (
          <img src={business.logo_url} alt={business.name} className="w-24 h-24 rounded-full mx-auto object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-secondary mx-auto flex items-center justify-center">
            <Building2 size={36} className="text-muted-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{business.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Programa de lealtad</p>
        </div>
        <div className="space-y-2">
          <Button className="w-full" onClick={() => navigate(`/b/${business.slug}/login`)}>
            Iniciar sesión
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate(`/b/${business.slug}/login?mode=register`)}>
            Crear cuenta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessLanding;
