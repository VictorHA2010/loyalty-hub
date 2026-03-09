import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserBusinesses } from '@/hooks/useData';
import { Skeleton } from '@/components/ui/skeleton';

const SelectBusiness = () => {
  const { user, setBusinessContext } = useAuth();
  const navigate = useNavigate();
  const { data: businesses, isLoading } = useUserBusinesses();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (businesses && businesses.length === 1) {
      const b = businesses[0];
      const biz = b.businesses as any;
      setBusinessContext({
        businessId: b.business_id,
        role: b.role as any,
        businessName: biz?.name || '',
      });
      const route = getRouteForRole(b.role);
      navigate(route);
    }
  }, [businesses, user, navigate, setBusinessContext]);

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

  if (!businesses || businesses.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-foreground">Sin negocios</h1>
          <p className="text-sm text-muted-foreground">
            No perteneces a ningún negocio aún.
          </p>
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
    const route = getRouteForRole(b.role);
    navigate(route);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 px-4">
        <h1 className="text-xl font-semibold text-center text-foreground">
          Seleccionar negocio
        </h1>
        <div className="space-y-2">
          {businesses.map((b) => {
            const biz = b.businesses as any;
            return (
              <button
                key={b.business_id}
                onClick={() => handleSelect(b)}
                className="w-full rounded-md border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
              >
                <p className="font-medium text-foreground">{biz?.name}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  {b.role}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function getRouteForRole(role: string): string {
  switch (role) {
    case 'platform_admin': return '/platform';
    case 'business_admin': return '/admin';
    case 'staff': return '/staff';
    default: return '/dashboard';
  }
}

export default SelectBusiness;
