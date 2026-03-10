import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessCustomers } from '@/hooks/useData';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, Crown } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';

const AdminCustomers = () => {
  const { businessContext } = useAuth();
  const { data: customers, isLoading } = useBusinessCustomers(businessContext?.businessId);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = (customers || []).filter((c: any) => {
    const name = (c.profiles?.full_name || '').toLowerCase();
    const email = (c.profiles?.email || '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <AppLayout role="admin">
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold text-foreground mb-6">Clientes</h1>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((c: any) => (
              <div key={c.id}>
                <button
                  onClick={() => setSelectedId(selectedId === c.profiles?.id ? null : c.profiles?.id)}
                  className="w-full flex items-center justify-between border border-border rounded-md p-4 bg-card hover:bg-secondary transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-muted-foreground">
                      {c.profiles?.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.profiles?.full_name || 'Sin nombre'}</p>
                      <p className="text-xs text-muted-foreground">{c.profiles?.email}</p>
                    </div>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground">
                    {new Date(c.joined_at).toLocaleDateString()}
                  </p>
                </button>
                {selectedId === c.profiles?.id && (
                  <CustomerDetail businessId={businessContext!.businessId} userId={c.profiles.id} />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            {search ? 'Sin resultados' : 'Sin clientes registrados'}
          </p>
        )}
      </div>
    </AppLayout>
  );
};

function CustomerDetail({ businessId, userId }: { businessId: string; userId: string }) {
  const queryClient = useQueryClient();
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const { data: balance } = useQuery({
    queryKey: ['customer-points', businessId, userId],
    queryFn: async () => {
      const { data } = await supabase.from('points_ledger').select('points').eq('business_id', businessId).eq('user_id', userId);
      return (data || []).reduce((sum, r) => sum + r.points, 0);
    },
  });

  const { data: membership } = useQuery({
    queryKey: ['customer-membership-admin', businessId, userId],
    queryFn: async () => {
      const { data } = await supabase.from('memberships').select('*').eq('business_id', businessId).eq('user_id', userId).maybeSingle();
      return data;
    },
  });

  const { data: history } = useQuery({
    queryKey: ['customer-history-admin', businessId, userId],
    queryFn: async () => {
      const { data } = await supabase.from('points_ledger').select('*').eq('business_id', businessId).eq('user_id', userId).order('created_at', { ascending: false }).limit(10);
      return data;
    },
  });

  const handleAdjust = async () => {
    const pts = parseInt(adjustPoints);
    if (!pts) return;
    setAdjusting(true);
    try {
      const { error } = await supabase.from('points_ledger').insert({
        business_id: businessId,
        user_id: userId,
        points: pts,
        type: pts > 0 ? 'adjustment' : 'deduction',
        note: adjustNote || 'Ajuste manual admin',
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['customer-points', businessId, userId] });
      queryClient.invalidateQueries({ queryKey: ['customer-history-admin', businessId, userId] });
      setAdjustPoints('');
      setAdjustNote('');
      toast.success('Puntos ajustados');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="border border-border border-t-0 rounded-b-md p-4 bg-card space-y-4">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs text-muted-foreground">Puntos</p>
          <p className="text-lg font-mono font-semibold text-foreground">{balance ?? 0}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Membresía</p>
          <div className="flex items-center gap-1">
            <p className="text-sm text-foreground">{membership?.status || 'Sin membresía'}</p>
            {(membership as any)?.is_plus && <Crown size={14} className="text-primary" />}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="±Puntos"
          value={adjustPoints}
          onChange={(e) => setAdjustPoints(e.target.value)}
          className="w-24"
        />
        <Input
          placeholder="Nota (opcional)"
          value={adjustNote}
          onChange={(e) => setAdjustNote(e.target.value)}
          className="flex-1"
        />
        <Button size="sm" onClick={handleAdjust} disabled={adjusting}>
          Ajustar
        </Button>
      </div>

      {history && history.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Últimos movimientos</p>
          {history.map((h) => (
            <div key={h.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <div>
                <p className="text-xs text-foreground">{h.note || h.type}</p>
                <p className="text-xs font-mono text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</p>
              </div>
              <p className={`text-xs font-mono ${h.points >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                {h.points >= 0 ? '+' : ''}{h.points}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminCustomers;
