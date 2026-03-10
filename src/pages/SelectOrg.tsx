import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserBusinesses } from '@/hooks/useData';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut } from 'lucide-react';

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
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold text-foreground">Error</h1>
          <p className="text-sm text-muted-foreground">No se pudieron cargar los negocios.</p>
          <button onClick={handleSignOut} className="text-sm text-primary hover:underline">Cerrar sesión</button>
        </div>
      </div>
    );
  }

  if (!businesses || businesses.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold text-foreground">Bienvenido</h1>
          <p className="text-sm text-muted-foreground">
            Aún no perteneces a ningún negocio. Un administrador debe agregarte a uno.
          </p>
          <button onClick={handleSignOut} className="flex items-center gap-2 mx-auto text-sm text-muted-foreground hover:text-foreground">
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
          <h1 className="text-xl font-semibold text-foreground">Seleccionar negocio</h1>
          <button onClick={handleSignOut} className="p-2 text-muted-foreground hover:bg-secondary rounded-md">
            <LogOut size={18} />
          </button>
        </div>
        <div className="space-y-2">
          {businesses.map((b) => {
            const biz = b.businesses as any;
            return (
              <button
                key={`${b.business_id}-${b.role}`}
                onClick={() => handleSelect(b)}
                className="w-full rounded-md border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
              >
                <p className="font-medium text-foreground">{biz?.name || 'Negocio'}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">{b.role}</p>
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
