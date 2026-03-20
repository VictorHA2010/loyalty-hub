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
        // 0. ¿Es platform_admin?
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role, business_id')
          .eq('user_id', userId);

        const isPlatformAdmin = roles?.some(r => r.role === 'platform_admin');
        if (isPlatformAdmin) {
          navigate('/platform');
          return;
        }

        // 1. ¿Es business_admin?
        const adminRole = roles?.find(r => r.role === 'business_admin' && r.business_id);
        if (adminRole) {
          const { data: biz } = await supabase
            .from('businesses')
            .select('slug')
            .eq('id', adminRole.business_id!)
            .maybeSingle();
          if (biz?.slug) { navigate(`/admin/${biz.slug}`); return; }
        }

        // 2. ¿Es staff?
        const staffRole = roles?.find(r => r.role === 'staff' && r.business_id);
        if (staffRole) {
          const { data: biz } = await supabase
            .from('businesses')
            .select('slug')
            .eq('id', staffRole.business_id!)
            .maybeSingle();
          if (biz?.slug) { navigate(`/staff/${biz.slug}`); return; }
        }

        // 3. ¿Es cliente de algún negocio?
        const { data: customerLink } = await supabase
          .from('customer_businesses')
          .select('business_id, businesses(slug)')
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();

        if (customerLink) {
          const slug = (customerLink.businesses as any)?.slug;
          if (slug) { navigate(`/b/${slug}/app`); return; }
        }

        // 4. Sin vínculo → check pago → planes o activación
        const hasPaid = localStorage.getItem('loyaltyhub_payment_completed') === 'true';
        if (hasPaid) {
          navigate('/activation');
        } else {
          navigate('/subscription-plans');
        }

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
