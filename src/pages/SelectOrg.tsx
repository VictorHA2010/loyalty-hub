import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserBusinesses } from '@/hooks/useData';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut, Shield, Building2 } from 'lucide-react';

const SelectBusiness = () => {
  const { user, globalRole, setBusinessContext, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: businesses, isLoading, error } = useUserBusinesses();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (globalRole === 'platform_admin') {
      navigate('/platform');
      return;
    }
  }, [user, globalRole, navigate]);

  useEffect(() => {
    if (!businesses || globalRole === 'platform_admin') return;
    if (businesses.length === 1) {
      const b = businesses[0];
      const biz = b.businesses as any;
      setBusinessContext({
        businessId: b.business_id!,
        role: b.role as any,
        businessName: biz?.name || '',
      });
      const route = getRouteForRole(b.role, biz?.slug);
      navigate(route);
    }
  }, [businesses, globalRole, navigate, setBusinessContext]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-full max-w-sm space-y-4 px-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold text-foreground">Error</h1>
          <p className="text-sm text-muted-foreground">No se pudieron cargar los negocios.</p>
          <button onClick={handleSignOut} className="text-sm text-primary font-semibold hover:underline">Cerrar sesión</button>
        </div>
      </div>
    );
  }

  if (!businesses || businesses.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Shield size={24} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Bienvenido</h1>
          <p className="text-sm text-muted-foreground">
            Aún no perteneces a ningún negocio. Un administrador debe agregarte a uno.
          </p>
          <button onClick={handleSignOut} className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground font-medium">
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  const handleSelect = (b: any) => {
    const biz = b.businesses as any;
    setBusinessContext({
      businessId: b.business_id,
      role: b.role as any,
      businessName: biz?.name || '',
    });
    const route = getRouteForRole(b.role, biz?.slug);
    navigate(route);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Shield size={16} className="text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold text-foreground">Seleccionar negocio</h1>
          </div>
          <button onClick={handleSignOut} className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <LogOut size={18} />
          </button>
        </div>
        <div className="space-y-3">
          {businesses.map((b) => {
            const biz = b.businesses as any;
            return (
              <button
                key={`${b.business_id}-${b.role}`}
                onClick={() => handleSelect(b)}
                className="w-full rounded-xl border border-border bg-card p-5 text-left transition-all hover:shadow-card-hover shadow-card"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{biz?.name || 'Negocio'}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{b.role}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function getRouteForRole(role: string, slug?: string): string {
  if (!slug) return '/select-business';
  switch (role) {
    case 'platform_admin': return '/platform';
    case 'business_admin': return `/admin/${slug}`;
    case 'staff': return `/staff/${slug}`;
    default: return `/b/${slug}/app`;
  }
}

export default SelectBusiness;
