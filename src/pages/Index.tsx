// src/pages/Index.tsx  ← reemplaza tu archivo completo

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
        // ── 1. PRIORIDAD: ¿Es dueño de un negocio? ──────────────────────────
        const { data: business } = await supabase
          .from('businesses')
          .select('slug')
          .eq('owner_id', userId)
          .maybeSingle();

        if (business?.slug) {
          navigate(`/admin/${business.slug}`);
          return;
        }

        // ── 2. ¿Es staff de un negocio? ─────────────────────────────────────
        const { data: staffMember } = await supabase
          .from('staff')
          .select('business_id, businesses(slug)')
          .eq('user_id', userId)
          .maybeSingle();

        if (staffMember) {
          // La relación devuelve un objeto, no un array
          const staffSlug = (staffMember.businesses as any)?.slug;
          if (staffSlug) {
            navigate(`/staff/${staffSlug}`);
            return;
          }
        }

        // ── 3. ¿Es cliente de algún negocio? ────────────────────────────────
        const { data: customerLink } = await supabase
          .from('customer_businesses')
          .select('business_id, businesses(slug)')
          .eq('user_id', userId)
          .maybeSingle();

        if (customerLink) {
          // FIX: antes era /business/:id — ahora usamos la ruta pública correcta
          const customerSlug = (customerLink.businesses as any)?.slug;
          if (customerSlug) {
            navigate(`/b/${customerSlug}`);
            return;
          }
        }

        // ── 4. Usuario sin ningún vínculo → onboarding / planes ─────────────
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
        <p className="text-sm text-muted-foreground animate-pulse">
          Cargando tu perfil...
        </p>
      </div>
    </div>
  );
};

export default Index;
