import { useAuth } from '@/contexts/AuthContext';
import { useBusinessRedemptions } from '@/hooks/useData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';

const StaffRedemptions = () => {
  const { businessContext } = useAuth();
  const { data: redemptions, isLoading } = useBusinessRedemptions(businessContext?.businessId);
  const queryClient = useQueryClient();

  const handleUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('redemptions')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['business-redemptions'] });
      toast.success(`Canje ${status === 'approved' ? 'aprobado' : 'rechazado'}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AppLayout role="staff">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold text-foreground mb-6">Canjes pendientes</h1>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : redemptions && redemptions.length > 0 ? (
          <div className="space-y-2">
            {redemptions.map((r) => (
              <div key={r.id} className="flex items-center justify-between border border-border rounded-md p-4 bg-card">
                <div>
                  <p className="text-sm font-medium text-foreground">{(r.rewards as any)?.name}</p>
                  <p className="text-xs text-muted-foreground">{(r.profiles as any)?.full_name}</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                    r.status === 'pending' ? 'bg-secondary text-muted-foreground' :
                    r.status === 'approved' ? 'bg-secondary text-foreground' :
                    'bg-secondary text-destructive'
                  }`}>
                    {r.status}
                  </span>
                  {r.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleUpdate(r.id, 'approved')}>
                        <Check size={14} />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleUpdate(r.id, 'rejected')}>
                        <X size={14} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Sin canjes</p>
        )}
      </div>
    </AppLayout>
  );
};

export default StaffRedemptions;
