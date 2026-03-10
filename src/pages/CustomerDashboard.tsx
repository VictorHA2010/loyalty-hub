import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import {
  useProfile, usePointsBalance, useRewards, usePointsHistory,
  useRedemptions, useCustomerMembership, useBusinessCoupons, useCustomerReferrals,
  useBonusPointsBalance,
} from '@/hooks/useData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Gift, History, LogOut, QrCode, User, Crown, Building2,
  Star, Ticket, Users, CreditCard, Copy, Check, ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';

type TabKey = 'home' | 'qr' | 'rewards' | 'promos' | 'referrals' | 'history' | 'membership' | 'profile';

const CustomerDashboard = () => {
  const { user, signOut } = useAuth();
  const { business, loading: bizLoading, error: bizError } = useBusiness();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const businessId = business?.id;
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: balance, isLoading: balanceLoading } = usePointsBalance(businessId);
  const { data: rewards, isLoading: rewardsLoading } = useRewards(businessId);
  const { data: history } = usePointsHistory(businessId);
  const { data: redemptions } = useRedemptions(businessId);
  const { data: membership } = useCustomerMembership(businessId);
  const { data: coupons } = useBusinessCoupons(businessId);
  const { data: referrals } = useCustomerReferrals(businessId);
  const [tab, setTab] = useState<TabKey>('home');
  const [redeeming, setRedeeming] = useState<string | null>(null);

  // Auto-link customer to business
  useEffect(() => {
    if (user && businessId) {
      supabase
        .from('customer_businesses')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', businessId)
        .maybeSingle()
        .then(({ data }) => {
          if (!data) {
            supabase.from('customer_businesses').insert({
              user_id: user.id,
              business_id: businessId,
            }).then(() => {});
          }
        });
    }
  }, [user, businessId]);

  // Auto-create referral code
  useEffect(() => {
    if (user && businessId && referrals !== undefined) {
      if (!referrals || referrals.length === 0) {
        const code = user.id.slice(0, 8).toUpperCase();
        supabase.from('referrals').insert({
          business_id: businessId,
          referrer_user_id: user.id,
          referral_code: code,
          status: 'invited',
        }).then(({ error }) => {
          if (!error) queryClient.invalidateQueries({ queryKey: ['customer-referrals'] });
        });
      }
    }
  }, [user, businessId, referrals]);

  if (bizLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (bizError || !business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Building2 size={48} className="mx-auto text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Negocio no encontrado</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate(`/b/${business.slug}/login`);
    return null;
  }

  const handleRedeem = async (rewardId: string, cost: number) => {
    if (balance === undefined || balance < cost) { toast.error('Puntos insuficientes'); return; }
    setRedeeming(rewardId);
    try {
      const { error: redError } = await supabase.from('redemptions').insert({
        business_id: businessId!, user_id: user.id, reward_id: rewardId, status: 'pending',
      });
      if (redError) throw redError;
      const { error: ptError } = await supabase.from('points_ledger').insert({
        business_id: businessId!, user_id: user.id, points: -cost, type: 'redeem', note: 'Canje de recompensa',
      });
      if (ptError) throw ptError;
      queryClient.invalidateQueries({ queryKey: ['points-balance'] });
      queryClient.invalidateQueries({ queryKey: ['redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['points-history'] });
      toast.success('Canje solicitado');
    } catch (err: any) { toast.error(err.message); }
    finally { setRedeeming(null); }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate(`/b/${business.slug}/login`);
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: 'Inicio', icon: <Star size={18} /> },
    { key: 'qr', label: 'Mi QR', icon: <QrCode size={18} /> },
    { key: 'rewards', label: 'Recompensas', icon: <Gift size={18} /> },
    { key: 'promos', label: 'Promociones', icon: <Ticket size={18} /> },
    { key: 'referrals', label: 'Invitar', icon: <Users size={18} /> },
    { key: 'history', label: 'Historial', icon: <History size={18} /> },
    { key: 'membership', label: 'Membresía', icon: <CreditCard size={18} /> },
    { key: 'profile', label: 'Perfil', icon: <User size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                <Building2 size={16} className="text-muted-foreground" />
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">{business.name}</p>
              <p className="text-sm font-semibold text-foreground">
                {profileLoading ? <Skeleton className="h-4 w-24" /> : (profile?.full_name || 'Usuario')}
              </p>
            </div>
          </div>
          <button onClick={handleSignOut} className="p-2 text-muted-foreground hover:bg-secondary rounded-md" title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Tab Navigation - Scrollable */}
      <nav className="bg-card border-b border-border sticky top-[57px] z-10">
        <div className="max-w-lg mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex flex-col items-center gap-1 px-4 py-2.5 text-xs transition-colors border-b-2 whitespace-nowrap ${
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
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5">
        {tab === 'home' && (
          <HomeTab
            balance={balance}
            balanceLoading={balanceLoading}
            membership={membership}
            profile={profile}
            businessName={business.name}
            onNavigate={setTab}
          />
        )}
        {tab === 'qr' && <QRTab qrToken={profile?.qr_token} profileLoading={profileLoading} />}
        {tab === 'rewards' && (
          <RewardsTab
            rewards={rewards}
            rewardsLoading={rewardsLoading}
            balance={balance}
            redeeming={redeeming}
            onRedeem={handleRedeem}
          />
        )}
        {tab === 'promos' && <PromosTab coupons={coupons} businessId={businessId!} userId={user.id} />}
        {tab === 'referrals' && <ReferralsTab referrals={referrals} businessId={businessId!} userId={user.id} />}
        {tab === 'history' && <HistoryTab history={history} redemptions={redemptions} />}
        {tab === 'membership' && <MembershipTab membership={membership} />}
        {tab === 'profile' && <ProfileTab businessSlug={business.slug} />}
      </main>
    </div>
  );
};

/* ═══════════════════════════════════════════ HOME TAB ═══════════════════════════════════════════ */
function HomeTab({ balance, balanceLoading, membership, profile, businessName, onNavigate }: any) {
  return (
    <div className="space-y-5">
      {/* Points Card */}
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-xs text-muted-foreground mb-1">Tus puntos en {businessName}</p>
        <p className="text-4xl font-bold font-mono text-foreground">
          {balanceLoading ? <Skeleton className="h-10 w-24 mx-auto" /> : (balance ?? 0)}
        </p>
        {membership?.status === 'active' && (
          <div className="flex items-center justify-center gap-1 mt-2">
            <Crown size={14} className="text-primary" />
            <span className="text-xs font-medium text-primary">
              {membership.is_plus ? 'Miembro Plus' : 'Miembro activo'}
              {membership.points_multiplier > 1 && ` · ${membership.points_multiplier}x puntos`}
            </span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'qr' as TabKey, icon: <QrCode size={20} />, label: 'Mi QR' },
          { key: 'rewards' as TabKey, icon: <Gift size={20} />, label: 'Recompensas' },
          { key: 'promos' as TabKey, icon: <Ticket size={20} />, label: 'Promociones' },
          { key: 'referrals' as TabKey, icon: <Users size={20} />, label: 'Invitar amigos' },
        ].map((action) => (
          <button
            key={action.key}
            onClick={() => onNavigate(action.key)}
            className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-secondary transition-colors text-left"
          >
            <div className="text-primary">{action.icon}</div>
            <span className="text-sm font-medium text-foreground">{action.label}</span>
            <ChevronRight size={14} className="ml-auto text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ QR TAB ═══════════════════════════════════════════ */
function QRTab({ qrToken, profileLoading }: { qrToken: string | null | undefined; profileLoading: boolean }) {
  if (profileLoading) return <div className="flex justify-center py-12"><Skeleton className="h-48 w-48" /></div>;

  return (
    <div className="flex flex-col items-center space-y-4">
      <p className="text-sm text-muted-foreground text-center">Muestra este código al staff para identificarte</p>
      <div className="bg-card border border-border rounded-xl p-6">
        {qrToken ? (
          <QRCodeSVG value={qrToken} size={200} level="M" />
        ) : (
          <div className="w-[200px] h-[200px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Generando QR...</p>
          </div>
        )}
      </div>
      {qrToken && (
        <p className="text-xs font-mono text-muted-foreground break-all text-center max-w-[250px]">{qrToken}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ REWARDS TAB ═══════════════════════════════════════════ */
function RewardsTab({ rewards, rewardsLoading, balance, redeeming, onRedeem }: any) {
  if (rewardsLoading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>;
  }

  if (!rewards || rewards.length === 0) {
    return (
      <div className="text-center py-12">
        <Gift size={40} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No hay recompensas disponibles en este momento</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Canjea tus puntos por beneficios exclusivos</p>
      {rewards.map((reward: any) => {
        const canRedeem = balance !== undefined && balance >= reward.points_cost;
        return (
          <div key={reward.id} className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-medium text-foreground">{reward.name}</p>
                {reward.description && <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>}
                <p className="text-sm font-mono text-primary mt-2">{reward.points_cost} pts</p>
              </div>
              <Button
                size="sm"
                onClick={() => onRedeem(reward.id, reward.points_cost)}
                disabled={redeeming === reward.id || !canRedeem}
              >
                {redeeming === reward.id ? '...' : 'Canjear'}
              </Button>
            </div>
            {!canRedeem && (
              <p className="text-xs text-muted-foreground mt-2">
                Te faltan {reward.points_cost - (balance ?? 0)} puntos
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════ PROMOS TAB ═══════════════════════════════════════════ */
function PromosTab({ coupons, businessId, userId }: { coupons: any; businessId: string; userId: string }) {
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const queryClient = useQueryClient();

  const handleApplyCode = async () => {
    if (!code.trim()) return;
    setApplying(true);
    try {
      // Find coupon by code
      const { data: coupon, error: findErr } = await supabase
        .from('coupons')
        .select('id, code, description, discount_type, discount_value')
        .eq('business_id', businessId)
        .eq('code', code.trim().toUpperCase())
        .eq('active', true)
        .maybeSingle();
      if (findErr) throw findErr;
      if (!coupon) { toast.error('Código no válido o expirado'); return; }

      // Check if already redeemed
      const { data: existing } = await supabase
        .from('coupon_redemptions')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', userId)
        .maybeSingle();
      if (existing) { toast.error('Ya has utilizado este código'); return; }

      // Redeem
      const { error: redeemErr } = await supabase.from('coupon_redemptions').insert({
        coupon_id: coupon.id,
        business_id: businessId,
        user_id: userId,
      });
      if (redeemErr) throw redeemErr;
      toast.success(`Cupón "${coupon.code}" aplicado correctamente`);
      setCode('');
      queryClient.invalidateQueries({ queryKey: ['business-coupons'] });
    } catch (err: any) { toast.error(err.message); }
    finally { setApplying(false); }
  };

  return (
    <div className="space-y-5">
      {/* Code input */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">¿Tienes un código promocional?</p>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ingresa el código"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <Button size="sm" onClick={handleApplyCode} disabled={applying || !code.trim()}>
            {applying ? '...' : 'Aplicar'}
          </Button>
        </div>
      </div>

      {/* Active coupons */}
      {coupons && coupons.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Promociones activas</p>
          {coupons.map((coupon: any) => (
            <div key={coupon.id} className="border border-border rounded-lg p-4 bg-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-foreground">{coupon.code}</p>
                  {coupon.description && <p className="text-sm text-muted-foreground mt-1">{coupon.description}</p>}
                </div>
                <span className="text-sm font-mono text-primary font-medium">
                  {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Ticket size={40} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No hay promociones activas por ahora</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ REFERRALS TAB ═══════════════════════════════════════════ */
function ReferralsTab({ referrals, businessId, userId }: { referrals: any; businessId: string; userId: string }) {
  const [friendCode, setFriendCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const myCode = referrals?.[0]?.referral_code || '';

  const handleCopy = () => {
    if (!myCode) return;
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    toast.success('Código copiado');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyFriendCode = async () => {
    if (!friendCode.trim()) return;
    const trimmed = friendCode.trim().toUpperCase();

    if (trimmed === myCode) {
      toast.error('No puedes usar tu propio código');
      return;
    }

    setApplying(true);
    try {
      // Find the referral with that code
      const { data: ref, error: findErr } = await supabase
        .from('referrals')
        .select('id, referrer_user_id, referred_user_id')
        .eq('business_id', businessId)
        .eq('referral_code', trimmed)
        .maybeSingle();
      if (findErr) throw findErr;
      if (!ref) { toast.error('Código de invitación no válido'); return; }
      if (ref.referred_user_id) { toast.error('Este código ya fue utilizado'); return; }
      if (ref.referrer_user_id === userId) { toast.error('No puedes usar tu propio código'); return; }

      // Check if user already used a referral for this business
      const { data: existingRef } = await supabase
        .from('referrals')
        .select('id')
        .eq('business_id', businessId)
        .eq('referred_user_id', userId)
        .maybeSingle();
      if (existingRef) { toast.error('Ya utilizaste un código de invitación en este negocio'); return; }

      // Note: referrals table doesn't allow UPDATE by users per RLS.
      // We'll create a new referral record linking the referred user.
      const { error: insertErr } = await supabase.from('referrals').insert({
        business_id: businessId,
        referrer_user_id: ref.referrer_user_id,
        referred_user_id: userId,
        referral_code: trimmed,
        status: 'completed',
      });
      if (insertErr) throw insertErr;

      toast.success('¡Código de invitación aplicado!');
      setFriendCode('');
      queryClient.invalidateQueries({ queryKey: ['customer-referrals'] });
    } catch (err: any) { toast.error(err.message); }
    finally { setApplying(false); }
  };

  return (
    <div className="space-y-5">
      {/* My code */}
      <div className="rounded-lg border border-border bg-card p-5 text-center space-y-3">
        <Users size={32} className="mx-auto text-primary" />
        <p className="text-sm font-medium text-foreground">Tu código de invitación</p>
        {myCode ? (
          <>
            <p className="text-2xl font-bold font-mono text-foreground tracking-widest">{myCode}</p>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copiado' : 'Copiar código'}
            </Button>
          </>
        ) : (
          <Skeleton className="h-8 w-32 mx-auto" />
        )}
        <p className="text-xs text-muted-foreground">Comparte este código con tus amigos</p>
      </div>

      {/* Enter friend code */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-medium text-foreground">¿Tienes un código de un amigo?</p>
        <div className="flex gap-2">
          <input
            value={friendCode}
            onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
            placeholder="Código de invitación"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <Button size="sm" onClick={handleApplyFriendCode} disabled={applying || !friendCode.trim()}>
            {applying ? '...' : 'Aplicar'}
          </Button>
        </div>
      </div>

      {/* Referral stats */}
      {referrals && referrals.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-2">Tus invitaciones</p>
          <p className="text-lg font-bold font-mono text-foreground">
            {referrals.filter((r: any) => r.status === 'completed').length} completadas
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ HISTORY TAB ═══════════════════════════════════════════ */
function HistoryTab({ history, redemptions }: { history: any; redemptions: any }) {
  return (
    <div className="space-y-5">
      {/* Points history */}
      <div>
        <p className="text-xs text-muted-foreground mb-3">Movimientos de puntos</p>
        {history && history.length > 0 ? (
          <div className="space-y-0 border border-border rounded-lg bg-card overflow-hidden">
            {history.map((entry: any, i: number) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between px-4 py-3 ${i < history.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div>
                  <p className="text-sm text-foreground">{entry.note || entry.type}</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <p className={`text-sm font-mono font-semibold ${entry.points >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                  {entry.points >= 0 ? '+' : ''}{entry.points}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <History size={40} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Sin movimientos registrados</p>
          </div>
        )}
      </div>

      {/* Redemptions */}
      {redemptions && redemptions.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">Canjes realizados</p>
          <div className="space-y-0 border border-border rounded-lg bg-card overflow-hidden">
            {redemptions.map((r: any, i: number) => (
              <div
                key={r.id}
                className={`flex items-center justify-between px-4 py-3 ${i < redemptions.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div>
                  <p className="text-sm text-foreground">{(r.rewards as any)?.name || 'Recompensa'}</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs font-mono px-2 py-1 rounded-md ${
                  r.status === 'approved' ? 'bg-secondary text-foreground' :
                  r.status === 'pending' ? 'bg-secondary text-muted-foreground' :
                  'bg-secondary text-destructive'
                }`}>
                  {r.status === 'approved' ? 'Aprobado' : r.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ MEMBERSHIP TAB ═══════════════════════════════════════════ */
function MembershipTab({ membership }: { membership: any }) {
  if (!membership) {
    return (
      <div className="text-center py-12">
        <CreditCard size={40} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No tienes una membresía activa en este negocio</p>
        <p className="text-xs text-muted-foreground mt-2">Consulta con el negocio para conocer los planes disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
        <Crown size={32} className="mx-auto text-primary" />
        <div>
          <p className="text-lg font-semibold text-foreground">
            {membership.plan_name || (membership.is_plus ? 'Membresía Plus' : 'Membresía')}
          </p>
          <span className={`text-xs font-mono px-2 py-1 rounded-md ${
            membership.status === 'active' ? 'bg-secondary text-foreground' : 'bg-secondary text-muted-foreground'
          }`}>
            {membership.status === 'active' ? 'Activa' : membership.status}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <p className="text-xs text-muted-foreground">Beneficios de tu membresía</p>
        <div className="space-y-2">
          {membership.points_multiplier > 1 && (
            <div className="flex items-center gap-2">
              <Star size={14} className="text-primary" />
              <span className="text-sm text-foreground">Multiplicador de puntos: {membership.points_multiplier}x</span>
            </div>
          )}
          {membership.bonus_points > 0 && (
            <div className="flex items-center gap-2">
              <Gift size={14} className="text-primary" />
              <span className="text-sm text-foreground">Puntos bonus: +{membership.bonus_points}</span>
            </div>
          )}
          {membership.started_at && (
            <div className="flex items-center gap-2">
              <History size={14} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Desde: {new Date(membership.started_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
          {membership.ends_at && (
            <div className="flex items-center gap-2">
              <History size={14} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Vence: {new Date(membership.ends_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ PROFILE TAB ═══════════════════════════════════════════ */
function ProfileTab({ businessSlug }: { businessSlug: string }) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setFullName(profile.full_name || '');
    setPhone(profile.phone || '');
    setInitialized(true);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user!.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil actualizado');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = `${user!.id}/profile.jpg`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: updateErr } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user!.id);
      if (updateErr) throw updateErr;
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Foto actualizada');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={24} className="text-muted-foreground" />
          )}
        </div>
        <label className="text-sm text-primary hover:underline cursor-pointer">
          Cambiar foto
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </label>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Nombre</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Teléfono</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Email</label>
        <p className="text-sm font-mono text-foreground">{user?.email}</p>
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </div>
  );
}

export default CustomerDashboard;
