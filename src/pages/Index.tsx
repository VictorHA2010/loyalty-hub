// src/pages/Index.tsx

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/login');
        return;
      }

      const userId = session.user.id;

      try {
        // 1. ¿Es business_admin de algún negocio?
        const { data: adminRole } = await supabase
          .from('user_roles')
          .select('business_id, businesses(slug)')
          .eq('user_id', userId)
          .eq('role', 'business_admin')
          .maybeSingle();

        if (adminRole) {
          const slug = (adminRole.businesses as any)?.slug;
          if (slug) { navigate(`/admin/${slug}`); return; }
        }

        // 2. ¿Es staff de algún negocio?
        const { data: staffRole } = await supabase
          .from('user_roles')
          .select('business_id, businesses(slug)')
          .eq('user_id', userId)
          .eq('role', 'staff')
          .maybeSingle();

        if (staffRole) {
          const slug = (staffRole.businesses as any)?.slug;
          if (slug) { navigate(`/staff/${slug}`); return; }
        }

        // 3. Sin negocio → planes
        navigate('/subscription-plans');

      } catch (error) {
        console.error('[Index] Error en redirección:', error);
        navigate('/login');
      }
    };

    checkUserAndRedirect();
  }, [navigate]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Cargando tu perfil...</p>
      </div>
    </div>
  );
};

export default Index;