import { useState, useRef, useEffect, useCallback } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
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
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
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
  const [saleAmount, setSaleAmount] = useState('');
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

  const calcPoints = (amount: number): number => {
    if (!amount || amount <= 0) return 0;

    const amountBase = Number(settings?.amount_base ?? 10);
    const pointsPerAmount = Number(settings?.points_per_amount ?? 1);
    const bonus = Number(settings?.points_bonus ?? 0);

    let pts = Math.round((amount / amountBase) * pointsPerAmount) + bonus;

    const hasActiveMembership =
      membership?.status === 'active' &&
      (membership?.is_plus || Number(membership?.points_multiplier) > 1);

    if (hasActiveMembership) {
      const multiplier =
        Number(membership?.points_multiplier) ||
        Number(settings?.membership_points_multiplier) ||
        1;

      pts = Math.round(pts * multiplier);
    }

    return pts;
  };

  const previewAmount = parseFloat(saleAmount) || 0;
  const previewPoints = calcPoints(previewAmount);

  const handleAssignPoints = async () => {
    const amount = parseFloat(saleAmount);
    if (!amount || amount <= 0) return;

    setAssigning(true);
    try {
      const finalPoints = calcPoints(amount);

      const { error } = await supabase.from('points_ledger').insert({
        business_id: businessId,
        user_id: user.id,
        points: finalPoints,
        type: 'earn',
        note: `venta_$${amount}`,
      });

      if (error) throw error;

      onBalanceUpdate(balance + finalPoints);
      setSaleAmount('');
      toast.success(`Venta: $${amount} → ${finalPoints} puntos`);

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
    <div className="border border-border rounded-xl bg-card p-5 space-y-4 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Users size={20} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-semibold text-foreground">{user.full_name || 'Sin nombre'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="text-lg font-bold font-mono text-primary">{balance} pts</p>
            {membership?.status === 'active' && (membership?.is_plus || Number(membership?.points_multiplier) > 1) && (
              <span className="text-xs font-mono font-semibold text-primary">
                ★ Plus (x{membership?.points_multiplier || 1})
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-sm">
              $
            </span>
            <Input
              type="number"
              placeholder="Monto de venta"
              value={saleAmount}
              onChange={(e) => setSaleAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAssignPoints()}
              min={0.01}
              step="0.01"
              className="h-11 pl-7"
            />
          </div>
          <Button
            onClick={handleAssignPoints}
            disabled={assigning || previewPoints <= 0}
            className="h-11 font-semibold"
          >
            <Plus size={18} className="mr-1" />
            Registrar
          </Button>
        </div>

        {previewAmount > 0 && (
          <p className="text-xs text-muted-foreground pl-1">
            Venta: <span className="font-semibold text-foreground">${previewAmount}</span>
            {' → '}
            <span className="font-bold text-primary">{previewPoints} puntos</span>
            {membership?.status === 'active' && (membership?.is_plus || Number(membership?.points_multiplier) > 1) && (
              <span className="text-primary"> (x{membership?.points_multiplier || 1} membresía)</span>
            )}
          </p>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
          Actividad reciente
        </p>
        {loadingActivity ? (
          <Skeleton className="h-12 w-full rounded-lg" />
        ) : activity.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sin actividad</p>
        ) : (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {activity.map((a) => (
              <div key={a.id} className="flex justify-between text-xs border-b border-border py-1.5">
                <span className="text-muted-foreground">
                  {a.type === 'earn'
                    ? '➕'
                    : a.type === 'bonus'
                    ? '🎁'
                    : a.type === 'redeem'
                    ? '🎟️'
                    : a.type === 'referral'
                    ? '👥'
                    : a.type === 'promotion'
                    ? '🎉'
                    : a.type === 'membership'
                    ? '⭐'
                    : '📝'}{' '}
                  {a.note || a.type}
                </span>
                <span className={`font-mono font-semibold ${a.points >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {a.points >= 0 ? '+' : ''}
                  {a.points}
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
        .maybeSingle();
      if (error) {
        console.error('Error buscando perfil:', error);
        toast.error('Error al buscar cliente');
        return;
      }
      if (!profile) {
        toast.error('Cliente no encontrado. Verifica que el QR sea válido.');
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
      try {
        await scannerRef.current.stop();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
    setWantScan(false);
  }, []);

  const startCamera = useCallback(async () => {
    setWantScan(true);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const el = document.getElementById('qr-reader');
      if (!el) {
        await new Promise((r) => setTimeout(r, 150));
        if (!document.getElementById('qr-reader')) {
          toast.error('No se pudo inicializar el escáner');
          setWantScan(false);
          return;
        }
      }
      const { Html5Qrcode } = await import('html5-qrcode');
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {}
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
        toast.error('Permiso de cámara denegado.');
      } else {
        toast.error('No se pudo iniciar la cámara: ' + (err?.message || err));
      }
    }
  }, [lookupByToken]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleManualScan = () => lookupByToken(qrToken);

  const dismiss = () => {
    setScannedUser(null);
    setQrToken('');
    setMembership(null);
  };

  return (
    <div className="space-y-5">
      {!wantScan && !scanning && !scannedUser && (
        <div className="text-center py-6">
          <button
            onClick={startCamera}
            className="w-28 h-28 rounded-3xl bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex flex-col items-center justify-center gap-2 mx-auto"
          >
            <Camera size={36} />
            <span className="text-xs font-bold">Escanear</span>
          </button>
          <p className="text-sm text-muted-foreground mt-4">Escanea el QR del cliente para asignar puntos</p>
        </div>
      )}

      {(wantScan || scanning) && !scannedUser && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Escanear QR</h2>
          <Button onClick={stopCamera} variant="outline" className="w-full h-11 font-semibold">
            <StopCircle size={18} className="mr-2" />
            Detener cámara
          </Button>
        </div>
      )}

      {wantScan && (
        <div
          id="qr-reader"
          ref={scannerContainerRef}
          className="w-full rounded-xl overflow-hidden border border-border"
          style={{ minHeight: 300 }}
        />
      )}

      <div className="flex gap-2">
        <Input
          placeholder="O ingresa el token QR manualmente"
          value={qrToken}
          onChange={(e) => setQrToken(e.target.value)}
          className="font-mono h-11"
          onKeyDown={(e) => e.key === 'Enter' && handleManualScan()}
        />
        <Button onClick={handleManualScan} className="h-11">
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
      <h2 className="text-lg font-bold text-foreground">Buscar clientes</h2>
      <div className="flex gap-2">
        <Input
          placeholder="Nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="h-11"
        />
        <Button onClick={handleSearch} disabled={searching} className="h-11">
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
              className="w-full text-left border border-border rounded-xl p-4 bg-card hover:shadow-card-hover transition-all shadow-card"
            >
              <p className="text-sm font-semibold text-foreground">{c.profiles?.full_name || 'Sin nombre'}</p>
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
      <h2 className="text-lg font-bold text-foreground">Canjes pendientes</h2>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : redemptions && redemptions.length > 0 ? (
        <div className="space-y-3">
          {redemptions.map((r) => (
            <div key={r.id} className="flex items-center justify-between border border-border rounded-xl p-5 bg-card shadow-card">
              <div>
                <p className="text-sm font-semibold text-foreground">{(r.rewards as any)?.name}</p>
                <p className="text-xs text-muted-foreground">{(r.profiles as any)?.full_name}</p>
                <p className="text-xs font-mono text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg ${
                    r.status === 'pending'
                      ? 'bg-warning/10 text-warning'
                      : r.status === 'approved'
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {r.status === 'pending' ? 'Pendiente' : r.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                </span>
                {r.status === 'pending' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleUpdate(r.id, 'approved')} className="h-8 w-8 p-0">
                      <Check size={14} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleUpdate(r.id, 'rejected')} className="h-8 w-8 p-0">
                      <X size={14} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Gift size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">Sin canjes pendientes</p>
        </div>
      )}
    </div>
  );
}

export default StaffDashboard;