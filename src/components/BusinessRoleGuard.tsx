import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface BusinessRoleGuardProps {
  children: React.ReactNode;
  allowed: string[];
}

/**
 * Verifies the current user has one of the allowed roles
 * for the current business before rendering children.
 * Platform admins always pass.
 */
const BusinessRoleGuard = ({ children, allowed }: BusinessRoleGuardProps) => {
  const { user, loading: authLoading, globalRole } = useAuth();
  const { business, loading: bizLoading } = useBusiness();
  const navigate = useNavigate();
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
          setAuthorized(true);
        }
        setChecking(false);
      });
  }, [user, business, authLoading, bizLoading, globalRole, allowed, navigate]);

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
