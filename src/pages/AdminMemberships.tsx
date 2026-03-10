import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessMemberships, useBusinessCustomers } from '@/hooks/useData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Crown, ToggleLeft, ToggleRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';

const AdminMemberships = () => {
  const { businessContext } = useAuth();
  const { data: memberships, isLoading } = useBusinessMemberships(businessContext?.businessId);
  const queryClient = useQueryClient();

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase.from('memberships').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['business-memberships'] });
      toast.success(`Membresía ${newStatus === 'active' ? 'activada' : 'desactivada'}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const togglePlus = async (id: string, currentPlus: boolean, multiplier: number) => {
    try {
      const { error } = await supabase.from('memberships').update({
        is_plus: !currentPlus,
        points_multiplier: !currentPlus ? (multiplier > 1 ? multiplier : 2) : 1,
      } as any).eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['business-memberships'] });
      toast.success(!currentPlus ? 'Plus activado' : 'Plus desactivado');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AppLayout role="admin">
      <div className="max-w-2xl">
        <h1 className="text-xl font-semibold text-foreground mb-6">Membresías</h1>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : memberships && memberships.length > 0 ? (
          <div className="space-y-2">
            {memberships.map((m: any) => (
              <div key={m.id} className="border border-border rounded-md p-4 bg-card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{m.profiles?.full_name || 'Sin nombre'}</p>
                      {m.is_plus && <Crown size={14} className="text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{m.profiles?.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${m.status === 'active' ? 'bg-secondary text-foreground' : 'bg-secondary text-muted-foreground'}`}>
                        {m.status}
                      </span>
                      {m.is_plus && (
                        <span className="text-xs font-mono text-primary">x{m.points_multiplier || 1}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePlus(m.id, m.is_plus, m.points_multiplier)}
                      title={m.is_plus ? 'Quitar Plus' : 'Hacer Plus'}
                    >
                      <Crown size={14} className={m.is_plus ? 'text-primary' : 'text-muted-foreground'} />
                    </Button>
                    <button
                      onClick={() => toggleStatus(m.id, m.status)}
                      className="p-2 text-muted-foreground hover:bg-secondary rounded-md"
                    >
                      {m.status === 'active' ? <ToggleRight size={18} className="text-primary" /> : <ToggleLeft size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Sin membresías registradas</p>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminMemberships;
