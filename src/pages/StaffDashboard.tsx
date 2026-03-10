import { useState, useRef, useEffect, useCallback } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessRedemptions, useLoyaltySettings } from '@/hooks/useData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { QrCode, Plus, X, Check, Search, Gift, Users, Camera, StopCircle } from 'lucide-react';
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
                tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
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

/* ─── Customer Card ─── */
function CustomerCard({
  user,
  balance,
  membership,
  businessId,
  settings,
  onDismiss,
  onBalanceUpdate,
}: {
  user: any;
  balance: number;
  membership: any;
  businessId: string;
  settings: any;
  onDismiss: () => void;
  onBalanceUpdate: (newBalance: number) => void;
}) {
  const [pointsToAssign, setPointsToAssign] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [activity, setActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    if (!user?.id || !businessId) return;
    setLoadingActivity(true);
    supabase
      .from('points_ledger')
      .select('*')
      .eq('business_id', businessId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setActivity(data || []);
        setLoadingActivity(false);
      });
  }, [user?.id, businessId]);

  const handleAssignPoints = async () => {
    let pts = parseInt(pointsToAssign);
    if (!pts || pts <= 0) return;
    setAssigning(true);
    try {
      let finalPoints = pts;
      if (membership?.is_plus && membership.status === 'active') {
        const multiplier = settings?.membership_points_multiplier || membership?.points_multiplier || 1;
        finalPoints = Math.round(finalPoints * Number(multiplier));
      }
      const { error } = await supabase.from('points_ledger').insert({
        business_id: businessId,
        user_id: user.id,
        points: finalPoints,
        type: 'earn',
        note: finalPoints !== pts
          ? `staff_assignment (x${membership?.points_multiplier || settings?.membership_points_multiplier})`
          : 'staff_assignment',
      });
      if (error) throw error;

      let totalAdded = finalPoints;
      if (settings?.free_bonus_points && settings.free_bonus_points > 0) {
        await supabase.from('points_ledger').insert({
          business_id: businessId,
          user_id: user.id,
          points: settings.free_bonus_points,
          type: 'bonus',
          note: 'bonus_points',
        });
        totalAdded += settings.free_bonus_points;
      }
      onBalanceUpdate(balance + totalAdded);
      setPointsToAssign('');
      toast.success(`${totalAdded} puntos asignados`);
      // Refresh activity
      const { data } = await supabase
        .from('points_ledger')
        .select('*')
        .eq('business_id', businessId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      setActivity(data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="border border-border rounded-md bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Users size={20} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{user.full_name || 'Sin nombre'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="text-lg font-mono text-foreground">{balance} pts</p>
            {membership?.is_plus && membership.status === 'active' && (
              <span className="text-xs font-mono text-primary">★ Plus (x{membership?.points_multiplier || 1})</span>
            )}
          </div>
        </div>
        <button onClick={onDismiss} className="p-2 text-muted-foreground hover:bg-secondary rounded-md">
          <X size={18} />
        </button>
      </div>

      {/* Assign points */}
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

      {/* Activity */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Actividad reciente</p>
        {loadingActivity ? (
          <Skeleton className="h-12 w-full" />
        ) : activity.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin actividad</p>
        ) : (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {activity.map((a) => (
              <div key={a.id} className="flex justify-between text-xs border-b border-border py-1">
                <span className="text-muted-foreground">
                  {a.type === 'earn' ? '➕' : a.type === 'bonus' ? '🎁' : a.type === 'redeem' ? '🎟️' : '📝'}{' '}
                  {a.note || a.type}
                </span>
                <span className={`font-mono ${a.points >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                  {a.points >= 0 ? '+' : ''}{a.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Scan Tab ─── */
function ScanTab() {
  const { business } = useBusiness();
  const businessId = business?.id;
  const { data: settings } = useLoyaltySettings(businessId);
  const [qrToken, setQrToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedUser, setScannedUser] = useState<any>(null);
  const [scannedBalance, setScannedBalance] = useState<number>(0);
  const [membership, setMembership] = useState<any>(null);
  const scannerRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const lookupByToken = useCallback(async (token: string) => {
    if (!token.trim() || !businessId) return;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('qr_token', token.trim())
        .single();
      if (error || !profile) {
        toast.error('Cliente no encontrado');
        return;
      }

      const { data: points } = await supabase
        .from('points_ledger')
        .select('points')
        .eq('business_id', businessId)
        .eq('user_id', profile.id);
      const balance = (points || []).reduce((sum, r) => sum + r.points, 0);

      const { data: mem } = await supabase
        .from('memberships')
        .select('*')
        .eq('business_id', businessId)
        .eq('user_id', profile.id)
        .maybeSingle();

      setScannedUser(profile);
      setScannedBalance(balance);
      setMembership(mem);
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [businessId]);

  const [wantScan, setWantScan] = useState(false);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
    setWantScan(false);
  }, []);

  // Start scanner directly from user click to satisfy mobile getUserMedia requirements
  const startCamera = useCallback(async () => {
    setWantScan(true);

    // Wait for DOM to paint the qr-reader div
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
      const el = document.getElementById('qr-reader');
      if (!el) {
        // Fallback: wait a bit more
        await new Promise((r) => setTimeout(r, 150));
        if (!document.getElementById('qr-reader')) {
          toast.error('No se pudo inicializar el escáner');
          setWantScan(false);
          return;
        }
      }

      const { Html5Qrcode } = await import('html5-qrcode');

      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch {}
      }

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          await scanner.stop();
          scannerRef.current = null;
          setScanning(false);
          setWantScan(false);
          setQrToken(decodedText);
          lookupByToken(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      setScanning(false);
      setWantScan(false);
      if (err?.name === 'NotAllowedError') {
        toast.error('Permiso de cámara denegado. Habilita el acceso a la cámara en la configuración de tu navegador.');
      } else {
        toast.error('No se pudo iniciar la cámara: ' + (err?.message || err));
      }
    }
  }, [lookupByToken]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const handleManualScan = () => lookupByToken(qrToken);

  const dismiss = () => {
    setScannedUser(null);
    setQrToken('');
    setMembership(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Escanear QR</h2>

      {/* Camera scanner */}
      <div className="flex gap-2">
        {!wantScan && !scanning ? (
          <Button onClick={startCamera} variant="outline" className="w-full">
            <Camera size={18} className="mr-2" />
            Abrir cámara
          </Button>
        ) : (
          <Button onClick={stopCamera} variant="outline" className="w-full">
            <StopCircle size={18} className="mr-2" />
            Detener cámara
          </Button>
        )}
      </div>

      {wantScan && (
        <div
          id="qr-reader"
          ref={scannerContainerRef}
          className="w-full rounded-md overflow-hidden border border-border"
          style={{ minHeight: 300 }}
        />
      )}

      {/* Manual token input */}
      <div className="flex gap-2">
        <Input
          placeholder="O ingresa el token QR manualmente"
          value={qrToken}
          onChange={(e) => setQrToken(e.target.value)}
          className="font-mono"
          onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
        />
        <Button onClick={handleManualScan}>
          <QrCode size={18} />
        </Button>
      </div>

      {scannedUser && businessId && (
        <CustomerCard
          user={scannedUser}
          balance={scannedBalance}
          membership={membership}
          businessId={businessId}
          settings={settings}
          onDismiss={dismiss}
          onBalanceUpdate={setScannedBalance}
        />
      )}
    </div>
  );
}

/* ─── Customers Tab ─── */
function CustomersTab() {
  const { business } = useBusiness();
  const businessId = business?.id;
  const { data: settings } = useLoyaltySettings(businessId);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedBalance, setSelectedBalance] = useState(0);
  const [selectedMembership, setSelectedMembership] = useState<any>(null);

  const handleSearch = async () => {
    if (!search.trim() || !businessId) return;
    setSearching(true);
    setSearched(true);
    setSelectedCustomer(null);
    try {
      const { data, error } = await supabase
        .from('customer_businesses')
        .select('*, profiles!customer_businesses_user_id_fkey(id, full_name, email, phone, avatar_url, qr_token)')
        .eq('business_id', businessId);
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

  const selectCustomer = async (customer: any) => {
    const profile = customer.profiles;
    if (!profile?.id || !businessId) return;

    const { data: points } = await supabase
      .from('points_ledger')
      .select('points')
      .eq('business_id', businessId)
      .eq('user_id', profile.id);
    const balance = (points || []).reduce((sum: number, r: any) => sum + r.points, 0);

    const { data: mem } = await supabase
      .from('memberships')
      .select('*')
      .eq('business_id', businessId)
      .eq('user_id', profile.id)
      .maybeSingle();

    setSelectedCustomer(profile);
    setSelectedBalance(balance);
    setSelectedMembership(mem);
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

      {selectedCustomer && businessId ? (
        <CustomerCard
          user={selectedCustomer}
          balance={selectedBalance}
          membership={selectedMembership}
          businessId={businessId}
          settings={settings}
          onDismiss={() => setSelectedCustomer(null)}
          onBalanceUpdate={setSelectedBalance}
        />
      ) : searched && results.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Cliente no encontrado</p>
      ) : results.length > 0 ? (
        <div className="space-y-2">
          {results.map((c: any) => (
            <button
              key={c.id}
              onClick={() => selectCustomer(c)}
              className="w-full text-left border border-border rounded-md p-3 bg-card hover:bg-secondary/50 transition-colors"
            >
              <p className="text-sm font-medium text-foreground">{c.profiles?.full_name || 'Sin nombre'}</p>
              <p className="text-xs text-muted-foreground">{c.profiles?.email}</p>
              {c.profiles?.phone && <p className="text-xs text-muted-foreground">{c.profiles.phone}</p>}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ─── Redemptions Tab ─── */
function RedemptionsTab() {
  const { business } = useBusiness();
  const businessId = business?.id;
  const { data: redemptions, isLoading } = useBusinessRedemptions(businessId);
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
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
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
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded ${
                    r.status === 'pending'
                      ? 'bg-secondary text-muted-foreground'
                      : r.status === 'approved'
                      ? 'bg-secondary text-foreground'
                      : 'bg-secondary text-destructive'
                  }`}
                >
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
