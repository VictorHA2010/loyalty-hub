import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAndRedirect = async () => {
      // 1. Verificamos si hay una sesión activa
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Si no hay sesión, lo mandamos al login (o dejamos que vea la landing)
        navigate('/login');
        return;
      }

      const userId = session.user.id;

      try {
        // 2. BUSCAMOS SI TIENE UN NEGOCIO (Prioridad Dueño/SaaS)
        const { data: business } = await supabase
          .from('businesses')
          .select('slug')
          .eq('owner_id', userId)
          .maybeSingle();

        if (business) {
          // Si tiene negocio, lo mandamos directo a su panel de administración
          navigate(`/admin/${business.slug}`);
          return;
        }

        // 3. SI NO ES DUEÑO, BUSCAMOS SI ES CLIENTE DE ALGUIEN
        const { data: customer } = await supabase
          .from('customer_businesses')
          .select('business_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (customer) {
          // Si es cliente, lo mandamos a ver sus puntos
          navigate(`/business/${customer.business_id}`);
          return;
        }

        // 4. SI NO ES NINGUNO (Usuario nuevo que quiere contratar)
        // Lo mandamos al dashboard principal para que cree su negocio
        navigate('/dashboard');

      } catch (error) {
        console.error("Error en la redirección:", error);
        navigate('/login');
      }
    };

    checkUserAndRedirect();
  }, [navigate]);

  // Mientras decide a dónde mandarlo, mostramos un cargando
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Redirigiendo...</p>
      </div>
    </div>
  );
};

export default Index;