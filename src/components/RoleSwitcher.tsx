import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowsLeftRight, Store, UserCircle } from 'lucide-react';

export const RoleSwitcher = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<{ hasBus: boolean; busId?: string } | null>(null);

  useEffect(() => {
    const checkRoles = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [bus, cust] = await Promise.all([
        supabase.from('businesses').select('id').eq('owner_id', session.user.id).maybeSingle(),
        supabase.from('customer_businesses').select('business_id').eq('user_id', session.user.id).maybeSingle()
      ]);

      if (bus.data && cust.data) {
        setData({ hasBus: true, busId: cust.data.business_id });
      }
    };
    checkRoles();
  }, []);

  if (!data) return null;

  const isCustomerMode = location.pathname.includes('/business/');

  return (
    <div className="px-4 py-2 mt-auto border-t">
      <Button 
        variant="outline" 
        className="w-full justify-start gap-2 text-xs h-9"
        onClick={() => navigate(isCustomerMode ? '/dashboard' : `/business/${data.busId}`)}
      >
        <ArrowsLeftRight size={14} />
        {isCustomerMode ? 'Modo Dueño' : 'Modo Cliente'}
      </Button>
    </div>
  );
};