import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessRedemptions, useLoyaltySettings } from '@/hooks/useData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { QrCode, Plus, X, Check, Search, History, Gift, Users } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';

type Tab = 'scan' | 'customers' | 'redemptions';

const StaffDashboard = () => {
  const [tab, setTab] = useState<Tab>('scan');

  const tabs = [
    { key: 'scan' as const, label: 'Escanear', icon: <QrCode size={16} /> },
    { key: 'customers' as const, label: 'Clientes', icon: <Users size={16} /> },
    { key: 'redemptions' as const, label: 'Canjes', icon: <Gift size={16} /> },
  ];

  return (
    <AppLayout role="staff">
      <div className="max-w-2xl mx-auto">
        <div className="flex border-b border-border mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors border-b-2 ${
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'scan' && <ScanTab />}
        {tab === 'customers' && <CustomersTab />}
        {tab === 'redemptions' && <RedemptionsTab />}
      </div>
    </AppLayout>
  );
};

function ScanTab() {
  const { businessContext } = useAuth();
  const { data: settings } = useLoyaltySettings(businessContext?.businessId);
  const queryClient = useQueryClient();
  const [qrToken, setQrToken] = useState('');
  const [scannedUser, setScannedUser] = useState<any>(null);
  const [scannedBalance, setScannedBalance] = useState<number>(0);
  const [membership, setMembership] = useState<any>(null);
  const [pointsToAssign, setPointsToAssign] = useState('');
  const [assigning, setAssigning] = useState(false);

  const handleScan = async () => {
    if (!qrToken.trim()) return;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('qr_token', qrToken.trim())
        .single();
      if (error || !profile) {
        toast.error('Usuario no encontrado');
        return;
      }

      const { data: points } = await supabase
        .from('points_ledger')
        .select('points')
        .eq('business_id', businessContext!.businessId)
        .eq('user_id', profile.id);
      const balance = (points || []).reduce((sum, r) => sum + r.points, 0);

      const { data: mem } = await supabase
        .from('memberships')
        .select('*')
        .eq('business_id', businessContext!.businessId)
        .eq('user_id', profile.id)
        .maybeSingle();

      setScannedUser(profile);
      setScannedBalance(balance);
      setMembership(mem);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAssignPoints = async () => {
    let pts = parseInt(pointsToAssign);
    if (!pts || pts <= 0 || !scannedUser) return;
    setAssigning(true);
    try {
      // Apply loyalty settings
      const basePoints = settings?.base_points_per_purchase || pts;
      let finalPoints = pts;
      
      // Apply Plus multiplier if applicable
      if (membership?.is_plus && membership.status === 'active') {
        const multiplier = settings?.membership_points_multiplier || (membership as any)?.points_multiplier || 1;
        finalPoints = Math.round(finalPoints * Number(multiplier));
      }

      const { error } = await supabase.from('points_ledger').insert({
        business_id: businessContext!.businessId,
        user_id: scannedUser.id,
        points: finalPoints,
        type: 'earn',
        note: finalPoints !== pts ? `staff_assignment (x${membership?.points_multiplier || settings?.membership_points_multiplier})` : 'staff_assignment',
      });
      if (error) throw error;

      // Add bonus points if configured
      if (settings?.free_bonus_points && settings.free_bonus_points > 0) {
        await supabase.from('points_ledger').insert({
          business_id: businessContext!.businessId,
          user_id: scannedUser.id,
          points: settings.free_bonus_points,
          type: 'bonus',
          note: 'bonus_points',
        });
        finalPoints += settings.free_bonus_points;
      }

      setScannedBalance((prev) => prev + finalPoints);
      setPointsToAssign('');
      toast.success(`${finalPoints} puntos asignados`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const dismiss = () => {
    setScannedUser(null);
    setQrToken('');
    setPointsToAssign('');
    setMembership(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Escanear QR</h2>
      <div className="flex gap-2">
        <Input
          placeholder="Token QR del cliente"
          value={qrToken}
          onChange={(e) => setQrToken(e.target.value)}
          className="font-mono"
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
        />
        <Button onClick={handleScan}>
          <QrCode size={18} />
        </Button>
      </div>

      {scannedUser && (
        <div className="border border-border rounded-md bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {scannedUser.avatar_url ? (
                  <img src={scannedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <QrCode size={20} className="text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">{scannedUser.full_name || 'Sin nombre'}</p>
                <p className="text-lg font-mono text-foreground">{scannedBalance} pts</p>
                {membership?.is_plus && membership.status === 'active' && (
                  <span className="text-xs font-mono text-primary">★ Plus (x{(membership as any)?.points_multiplier || 1})</span>
                )}
              </div>
            </div>
            <button onClick={dismiss} className="p-2 text-muted-foreground hover:bg-secondary rounded-md">
              <X size={18} />
            </button>
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Puntos a asignar"
              value={pointsToAssign}
              onChange={(e) => setPointsToAssign(e.target.value)}
              min={1}
            />
            <Button onClick={handleAssignPoints} disabled={assigning}>
              <Plus size={18} className="mr-1" />
              Asignar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersTab() {
  const { businessContext } = useAuth();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!search.trim() || !businessContext) return;
    setSearching(true);
    try {
      // Search customers of this business
      const { data, error } = await supabase
        .from('customer_businesses')
        .select('*, profiles(id, full_name, email, phone, qr_token)')
        .eq('business_id', businessContext.businessId);
      if (error) throw error;

      const q = search.toLowerCase();
      const filtered = (data || []).filter((c: any) => {
        const name = (c.profiles?.full_name || '').toLowerCase();
        const email = (c.profiles?.email || '').toLowerCase();
        const phone = (c.profiles?.phone || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q);
      });
      setResults(filtered);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Buscar clientes</h2>
      <div className="flex gap-2">
        <Input
          placeholder="Nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={searching}>
          <Search size={18} />
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((c: any) => (
            <div key={c.id} className="border border-border rounded-md p-3 bg-card">
              <p className="text-sm font-medium text-foreground">{c.profiles?.full_name || 'Sin nombre'}</p>
              <p className="text-xs text-muted-foreground">{c.profiles?.email}</p>
              {c.profiles?.phone && <p className="text-xs text-muted-foreground">{c.profiles.phone}</p>}
              <p className="text-xs font-mono text-muted-foreground mt-1">QR: {c.profiles?.qr_token?.slice(0, 8)}...</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RedemptionsTab() {
  const { businessContext } = useAuth();
  const { data: redemptions, isLoading } = useBusinessRedemptions(businessContext?.businessId);
  const queryClient = useQueryClient();

  const handleUpdate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase.from('redemptions').update({ status }).eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['business-redemptions'] });
      toast.success(`Canje ${status === 'approved' ? 'aprobado' : 'rechazado'}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Canjes pendientes</h2>
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
                <p className="text-xs font-mono text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
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
  );
}

export default StaffDashboard;
