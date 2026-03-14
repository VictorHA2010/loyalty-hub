import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface BusinessRoleGuardProps {
  children: React.ReactNode;
  allowed: string[];
}

const BusinessRoleGuard = ({ children, allowed }: BusinessRoleGuardProps) => {
  const { user, loading: authLoading, globalRole } = useAuth();
  const { business, loading: bizLoading } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading || bizLoading) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    // Platform admins can access everything
    if (globalRole === 'platform_admin') {
      setAuthorized(true);
      setChecking(false);
      return;
    }

    if (!business) {
      setChecking(false);
      return;
    }

    // Check user's role for this specific business
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('business_id', business.id)
      .then(({ data }) => {
        const roles = (data || []).map((r) => r.role);
        const hasAccess = roles.some((r) => allowed.includes(r));
        if (!hasAccess) {
          navigate('/select-business', { replace: true });
        } else {
          // Subscription guard: if business is not active and user is business_admin,
          // redirect to plans page (unless already on plans page)
          const isOnPlansPage = location.pathname.endsWith('/plans');
          if (!isOnPlansPage && !business.is_active && roles.includes('business_admin')) {
            navigate(`/admin/${business.slug}/plans`, { replace: true });
          } else {
            setAuthorized(true);
          }
        }
        setChecking(false);
      });
  }, [user, business, authLoading, bizLoading, globalRole, allowed, navigate, location.pathname]);

  if (authLoading || bizLoading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
};

export default BusinessRoleGuard;
