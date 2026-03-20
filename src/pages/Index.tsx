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
        // 1. PRIORIDAD: ¿ES DUEÑO DE UN NEGOCIO?
        const { data: business } = await supabase
          .from('businesses')
          .select('slug')
          .eq('owner_id', userId)
          .maybeSingle();

        if (business) {
          navigate(`/admin/${business.slug}`);
          return;
        }

        // 2. ¿ES STAFF DE UN NEGOCIO?
        const { data: staffMember } = await supabase
          .from('staff') // Asegúrate que tu tabla se llame 'staff'
          .select('business_id, businesses(slug)')
          .eq('user_id', userId)
          .maybeSingle();

        if (staffMember) {
          // @ts-ignore
          const staffSlug = staffMember.businesses?.slug;
          navigate(`/staff/${staffSlug || ''}`);
          return;
        }

        // 3. ¿ES CLIENTE DE ALGUIEN?
        const { data: customer } = await supabase
          .from('customer_businesses')
          .select('business_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (customer) {
          navigate(`/business/${customer.business_id}`);
          return;
        }

        // 4. SI NO ES NADA DE LO ANTERIOR: Es un usuario que quiere contratar
        // O un cliente que entró por la URL principal para crear su negocio
        navigate('/subscription-plans');

      } catch (error) {
        console.error("Error en la redirección:", error);
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