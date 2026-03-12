import { useNavigate } from 'react-router-dom';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Building2, Shield } from 'lucide-react';
import { useEffect } from 'react';

const BusinessLanding = () => {
  const { business, loading, error } = useBusiness();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
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
          <Building2 size={48} className="mx-auto text-muted-foreground/30" />
          <h1 className="text-xl font-bold text-foreground">Negocio no encontrado</h1>
          <p className="text-sm text-muted-foreground">La URL del negocio no es válida.</p>
        </div>
      </div>
    );
  }

  const brandColor = business.primary_color || undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-8 px-4">
        {business.logo_url ? (
          <img src={business.logo_url} alt={business.name} className="w-24 h-24 rounded-2xl mx-auto object-cover shadow-elevated" />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center shadow-elevated">
            <Shield size={36} className="text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">{business.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">Programa de lealtad</p>
          {business.short_description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">{business.short_description}</p>
          )}
        </div>
        <div className="space-y-3 max-w-xs mx-auto">
          <Button
            className="w-full h-12 font-bold text-base"
            onClick={() => navigate(`/b/${business.slug}/login`)}
            style={brandColor ? { backgroundColor: brandColor } : {}}
          >
            Iniciar sesión
          </Button>
          <Button variant="outline" className="w-full h-12 font-semibold" onClick={() => navigate(`/b/${business.slug}/login?mode=register`)}>
            Crear cuenta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BusinessLanding;
