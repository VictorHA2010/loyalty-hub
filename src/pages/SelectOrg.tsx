import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizations } from '@/hooks/useData';
import { Skeleton } from '@/components/ui/skeleton';

const SelectOrg = () => {
  const { user, setOrgContext } = useAuth();
  const navigate = useNavigate();
  const { data: orgs, isLoading } = useOrganizations();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Auto-select if only one org
    if (orgs && orgs.length === 1) {
      const org = orgs[0];
      const orgData = org.organizations as any;
      setOrgContext({
        organizationId: org.organization_id,
        role: org.role as any,
        orgName: orgData?.name || '',
      });
      const route = org.role === 'admin' ? '/admin' : org.role === 'staff' ? '/staff' : '/dashboard';
      navigate(route);
    }
  }, [orgs, user, navigate, setOrgContext]);

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

  if (!orgs || orgs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-foreground">Sin organizaciones</h1>
          <p className="text-sm text-muted-foreground">
            No perteneces a ninguna organización aún.
          </p>
        </div>
      </div>
    );
  }

  const handleSelect = (org: any) => {
    const orgData = org.organizations as any;
    setOrgContext({
      organizationId: org.organization_id,
      role: org.role as any,
      orgName: orgData?.name || '',
    });
    const route = org.role === 'admin' ? '/admin' : org.role === 'staff' ? '/staff' : '/dashboard';
    navigate(route);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 px-4">
        <h1 className="text-xl font-semibold text-center text-foreground">
          Seleccionar organización
        </h1>
        <div className="space-y-2">
          {orgs.map((org) => {
            const orgData = org.organizations as any;
            return (
              <button
                key={org.organization_id}
                onClick={() => handleSelect(org)}
                className="w-full rounded-md border border-border bg-card p-4 text-left transition-colors hover:bg-secondary"
              >
                <p className="font-medium text-foreground">{orgData?.name}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  {org.role}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SelectOrg;
