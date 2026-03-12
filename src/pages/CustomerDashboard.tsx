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
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  Gift, History, LogOut, QrCode, User, Crown, Building2,
  Star, Ticket, Users, CreditCard, Copy, Check, ChevronRight, Shield,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';

type TabKey = 'home' | 'qr' | 'rewards' | 'promos' | 'referrals' | 'history' | 'membership' | 'profile';

/* ═══════════ Brand helper ═══════════ */
function useBrandVars(business: any) {
  return useMemo(() => {
    const primary = business?.primary_color || '#1F7A63';
    const secondary = business?.secondary_color || '#2FA886';
    const accent = business?.accent_color || '#66C2A5';
    return {
      primary,
      secondary,
      accent,
      css: {
        '--brand-primary': primary,
        '--brand-secondary': secondary,
        '--brand-accent': accent,
      } as React.CSSProperties,
    };
  }, [business?.primary_color, business?.secondary_color, business?.accent_color]);
}

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
  const { data: bonusBalance, isLoading: bonusLoading } = useBonusPointsBalance(businessId);
  const [tab, setTab] = useState<TabKey>('home');
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const brand = useBrandVars(business);

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
          <h1 className="text-xl font-bold text-foreground">Negocio no encontrado</h1>
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
    { key: 'rewards', label: 'Premios', icon: <Gift size={18} /> },
    { key: 'promos', label: 'Promos', icon: <Ticket size={18} /> },
    { key: 'referrals', label: 'Invitar', icon: <Users size={18} /> },
    { key: 'history', label: 'Historial', icon: <History size={18} /> },
    { key: 'membership', label: 'Membresía', icon: <CreditCard size={18} /> },
    { key: 'profile', label: 'Perfil', icon: <User size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" style={brand.css}>
      {/* ══════════ Branded Header ══════════ */}
      <header
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${brand.primary}, ${brand.secondary})`,
        }}
      >
        {business.banner_image && (
          <img
            src={business.banner_image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
          />
        )}
        <div className="relative max-w-lg mx-auto px-4 pt-5 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-white/25 shadow-lg"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/10">
                  <Shield size={18} className="text-white" />
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-white/70">{business.name}</p>
                <p className="text-sm font-bold text-white">
                  {profileLoading ? <Skeleton className="h-4 w-24 bg-white/20" /> : `Hola, ${profile?.full_name || 'Usuario'}`}
                </p>
              </div>
            </div>
            <button onClick={handleSignOut} className="p-2.5 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors" title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>

          {/* Welcome message */}
          {business.welcome_message && (
            <p className="text-xs text-white/60 mb-4">{business.welcome_message}</p>
          )}

          {/* Inline Points Card */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-white/60 uppercase tracking-wider">Tus puntos</p>
                <p className="text-4xl font-extrabold font-mono text-white mt-0.5">
                  {balanceLoading ? <Skeleton className="h-10 w-24 bg-white/20" /> : (balance ?? 0)}
                </p>
              </div>
              {membership?.status === 'active' && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/10">
                  <Crown size={13} className="text-white" />
                  <span className="text-[11px] font-semibold text-white">
                    {membership.is_plus ? 'Plus' : 'Miembro'}
                    {membership.points_multiplier > 1 && ` · ${membership.points_multiplier}x`}
                  </span>
                </div>
              )}
            </div>
            {/* Progress bar toward next reward */}
            {rewards && rewards.length > 0 && balance !== undefined && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-white/50">Próxima recompensa</p>
                  <p className="text-[10px] text-white/70 font-mono">{balance}/{rewards[0].points_cost} pts</p>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (balance / rewards[0].points_cost) * 100)}%`,
                      backgroundColor: brand.accent,
                    }}
                  />
                </div>
                <p className="text-[10px] text-white/40 mt-1">{rewards[0].name}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ══════════ Tab Navigation ══════════ */}
      <nav className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex min-w-max">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex flex-col items-center gap-1 px-4 py-2.5 text-[11px] font-medium transition-colors border-b-2 whitespace-nowrap ${
                  tab === t.key
                    ? 'text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                style={tab === t.key ? { borderBottomColor: brand.primary, color: brand.primary } : undefined}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ══════════ Content ══════════ */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        {tab === 'home' && (
          <HomeTab
            balance={balance}
            balanceLoading={balanceLoading}
            bonusBalance={bonusBalance}
            bonusLoading={bonusLoading}
            membership={membership}
            profile={profile}
            businessName={business.name}
            brand={brand}
            onNavigate={setTab}
            banner={{
              active: business.banner_active,
              image: business.banner_image,
              title: business.banner_title,
              description: business.banner_description,
              link: business.banner_link,
            }}
          />
        )}
        {tab === 'qr' && <QRTab qrToken={profile?.qr_token} profileLoading={profileLoading} brand={brand} businessName={business.name} />}
        {tab === 'rewards' && (
          <RewardsTab
            rewards={rewards}
            rewardsLoading={rewardsLoading}
            balance={balance}
            redeeming={redeeming}
            onRedeem={handleRedeem}
            brand={brand}
          />
        )}
        {tab === 'promos' && <PromosTab coupons={coupons} businessId={businessId!} userId={user.id} brand={brand} />}
        {tab === 'referrals' && <ReferralsTab referrals={referrals} businessId={businessId!} userId={user.id} brand={brand} />}
        {tab === 'history' && <HistoryTab history={history} redemptions={redemptions} brand={brand} />}
        {tab === 'membership' && <MembershipTab membership={membership} brand={brand} />}
        {tab === 'profile' && <ProfileTab businessSlug={business.slug} />}
      </main>
    </div>
  );
};

/* ═══════════════════════════════════════════ HOME TAB ═══════════════════════════════════════════ */
function HomeTab({ balance, balanceLoading, bonusBalance, bonusLoading, membership, profile, businessName, brand, onNavigate, banner }: any) {
  return (
    <div className="space-y-5">
      {/* Promotional Banner */}
      {banner?.active && (banner?.title || banner?.image) && (
        <div className="rounded-2xl overflow-hidden shadow-sm border border-border bg-card">
          {banner.image && (
            <div className="relative">
              <img src={banner.image} alt={banner.title || 'Promoción'} className="w-full h-40 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {banner.title && <p className="text-base font-bold text-white">{banner.title}</p>}
                {banner.description && <p className="text-xs text-white/80 mt-0.5">{banner.description}</p>}
                {banner.link && (
                  <a
                    href={banner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: brand.primary }}
                  >
                    Ver más
                  </a>
                )}
              </div>
            </div>
          )}
          {!banner.image && (
            <div className="p-5" style={{ background: `linear-gradient(135deg, ${brand.primary}15, ${brand.accent}15)` }}>
              {banner.title && <p className="text-base font-bold text-foreground">{banner.title}</p>}
              {banner.description && <p className="text-xs text-muted-foreground mt-1">{banner.description}</p>}
              {banner.link && (
                <a
                  href={banner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: brand.primary }}
                >
                  Ver más
                </a>
              )}
            </div>
          )}
        </div>
      )}
      {/* Bonus Points */}
      <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${brand.primary}15` }}>
            <Gift size={18} style={{ color: brand.primary }} />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Puntos de regalo</p>
            <p className="text-2xl font-bold font-mono text-foreground">
              {bonusLoading ? <Skeleton className="h-7 w-14 inline-block" /> : (bonusBalance ?? 0)}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Puntos extra por promociones, membresía o bonos especiales.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: 'qr' as TabKey, icon: <QrCode size={20} />, label: 'Mi QR' },
          { key: 'rewards' as TabKey, icon: <Gift size={20} />, label: 'Premios' },
          { key: 'promos' as TabKey, icon: <Ticket size={20} />, label: 'Promociones' },
          { key: 'referrals' as TabKey, icon: <Users size={20} />, label: 'Invitar amigos' },
        ].map((action) => (
          <button
            key={action.key}
            onClick={() => onNavigate(action.key)}
            className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all text-left shadow-sm group"
          >
            <div style={{ color: brand.primary }}>{action.icon}</div>
            <span className="text-sm font-semibold text-foreground">{action.label}</span>
            <ChevronRight size={14} className="ml-auto text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════ QR TAB ═══════════════════════════════════════════ */
function QRTab({ qrToken, profileLoading, brand, businessName }: { qrToken: string | null | undefined; profileLoading: boolean; brand: any; businessName: string }) {
  if (profileLoading) return <div className="flex justify-center py-12"><Skeleton className="h-48 w-48" /></div>;

  return (
    <div className="flex flex-col items-center space-y-5">
      <div className="rounded-2xl bg-card border border-border p-8 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${brand.primary}15` }}>
          <QrCode size={22} style={{ color: brand.primary }} />
        </div>
        {qrToken ? (
          <div className="p-4 bg-white rounded-xl inline-block">
            <QRCodeSVG value={qrToken} size={200} level="M" fgColor={brand.primary} />
          </div>
        ) : (
          <div className="w-[200px] h-[200px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Generando QR...</p>
          </div>
        )}
        <p className="text-sm font-medium text-foreground mt-4">Muéstralo en caja para acumular puntos</p>
        <p className="text-xs text-muted-foreground mt-1">{businessName}</p>
      </div>
      {qrToken && (
        <p className="text-xs font-mono text-muted-foreground break-all text-center max-w-[250px]">{qrToken}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ REWARDS TAB ═══════════════════════════════════════════ */
function RewardsTab({ rewards, rewardsLoading, balance, redeeming, onRedeem, brand }: any) {
  if (rewardsLoading) {
    return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>;
  }

  if (!rewards || rewards.length === 0) {
    return (
      <div className="text-center py-16">
        <Gift size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">No hay recompensas disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Canjea tus puntos por beneficios exclusivos</p>
      {rewards.map((reward: any) => {
        const canRedeem = balance !== undefined && balance >= reward.points_cost;
        const progress = balance !== undefined ? Math.min(100, (balance / reward.points_cost) * 100) : 0;
        return (
          <div key={reward.id} className="border border-border rounded-xl p-5 bg-card shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold text-foreground">{reward.name}</p>
                {reward.description && <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>}
                <p className="text-sm font-mono font-bold mt-2" style={{ color: brand.primary }}>{reward.points_cost} pts</p>
              </div>
              <Button
                size="sm"
                onClick={() => onRedeem(reward.id, reward.points_cost)}
                disabled={redeeming === reward.id || !canRedeem}
                className="font-semibold text-white"
                style={{ backgroundColor: brand.primary }}
              >
                {redeeming === reward.id ? '...' : 'Canjear'}
              </Button>
            </div>
            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, backgroundColor: brand.accent }}
                />
              </div>
              {!canRedeem && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Te faltan {reward.points_cost - (balance ?? 0)} puntos
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════ PROMOS TAB ═══════════════════════════════════════════ */
function PromosTab({ coupons, businessId, userId, brand }: { coupons: any; businessId: string; userId: string; brand: any }) {
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const queryClient = useQueryClient();

  const handleApplyCode = async () => {
    if (!code.trim()) return;
    setApplying(true);
    try {
      const { data: coupon, error: findErr } = await supabase
        .from('coupons')
        .select('id, code, description, discount_type, discount_value')
        .eq('business_id', businessId)
        .eq('code', code.trim().toUpperCase())
        .eq('active', true)
        .maybeSingle();
      if (findErr) throw findErr;
      if (!coupon) { toast.error('Código no válido o expirado'); return; }

      const { data: existing } = await supabase
        .from('coupon_redemptions')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', userId)
        .maybeSingle();
      if (existing) { toast.error('Ya has utilizado este código'); return; }

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
      <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
        <p className="text-sm font-semibold text-foreground">¿Tienes un código promocional?</p>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ingresa el código"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            size="sm"
            onClick={handleApplyCode}
            disabled={applying || !code.trim()}
            className="font-semibold text-white"
            style={{ backgroundColor: brand.primary }}
          >
            {applying ? '...' : 'Aplicar'}
          </Button>
        </div>
      </div>

      {coupons && coupons.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Promociones activas</p>
          {coupons.map((coupon: any) => (
            <div key={coupon.id} className="border rounded-xl p-5 bg-card shadow-sm" style={{ borderColor: `${brand.accent}40` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-foreground">{coupon.code}</p>
                  {coupon.description && <p className="text-sm text-muted-foreground mt-1">{coupon.description}</p>}
                </div>
                <span className="text-sm font-mono font-bold" style={{ color: brand.primary }}>
                  {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Ticket size={48} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">No hay promociones activas por ahora</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ REFERRALS TAB ═══════════════════════════════════════════ */
function ReferralsTab({ referrals, businessId, userId, brand }: { referrals: any; businessId: string; userId: string; brand: any }) {
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
    if (trimmed === myCode) { toast.error('No puedes usar tu propio código'); return; }
    setApplying(true);
    try {
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

      const { data: existingRef } = await supabase
        .from('referrals')
        .select('id')
        .eq('business_id', businessId)
        .eq('referred_user_id', userId)
        .maybeSingle();
      if (existingRef) { toast.error('Ya utilizaste un código de invitación en este negocio'); return; }

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
      <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: `${brand.primary}15` }}>
          <Users size={24} style={{ color: brand.primary }} />
        </div>
        <p className="text-sm font-semibold text-foreground">Tu código de invitación</p>
        {myCode ? (
          <>
            <p className="text-3xl font-extrabold font-mono text-foreground tracking-widest">{myCode}</p>
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 font-semibold">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copiado' : 'Copiar código'}
            </Button>
          </>
        ) : (
          <Skeleton className="h-8 w-32 mx-auto" />
        )}
        <p className="text-xs text-muted-foreground">Comparte este código con tus amigos</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
        <p className="text-sm font-semibold text-foreground">¿Tienes un código de un amigo?</p>
        <div className="flex gap-2">
          <input
            value={friendCode}
            onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
            placeholder="Código de invitación"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            size="sm"
            onClick={handleApplyFriendCode}
            disabled={applying || !friendCode.trim()}
            className="font-semibold text-white"
            style={{ backgroundColor: brand.primary }}
          >
            {applying ? '...' : 'Aplicar'}
          </Button>
        </div>
      </div>

      {referrals && referrals.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Tus invitaciones</p>
          <p className="text-2xl font-bold font-mono text-foreground">
            {referrals.filter((r: any) => r.status === 'completed').length} completadas
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════ HISTORY TAB ═══════════════════════════════════════════ */
function HistoryTab({ history, redemptions, brand }: { history: any; redemptions: any; brand: any }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Movimientos de puntos</p>
        {history && history.length > 0 ? (
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            {history.map((entry: any, i: number) => {
              const typeLabel = entry.type === 'bonus' ? '🎁 Regalo'
                : entry.type === 'earn' ? '➕ Ganados'
                : entry.type === 'redeem' ? '🎟️ Canje'
                : entry.type === 'adjustment' ? '📝 Ajuste'
                : entry.type === 'referral' ? '👥 Referido'
                : entry.type === 'promotion' ? '🎉 Promoción'
                : entry.type === 'membership' ? '⭐ Membresía'
                : entry.type;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between px-4 py-3.5 ${i < history.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      entry.type === 'bonus' ? 'bg-primary/10 text-primary'
                      : entry.type === 'redeem' ? 'bg-destructive/10 text-destructive'
                      : 'bg-muted text-muted-foreground'
                    }`}>
                      {typeLabel}
                    </span>
                    <p className="text-sm text-foreground mt-1">{entry.note || entry.type}</p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {new Date(entry.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <p className={`text-sm font-mono font-bold`} style={{ color: entry.points >= 0 ? brand.primary : undefined }}>
                    <span className={entry.points < 0 ? 'text-destructive' : ''}>
                      {entry.points >= 0 ? '+' : ''}{entry.points}
                    </span>
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <History size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">Sin movimientos registrados</p>
          </div>
        )}
      </div>

      {redemptions && redemptions.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Canjes realizados</p>
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            {redemptions.map((r: any, i: number) => (
              <div
                key={r.id}
                className={`flex items-center justify-between px-4 py-3.5 ${i < redemptions.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{(r.rewards as any)?.name || 'Recompensa'}</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg ${
                  r.status === 'approved' ? 'bg-success/10 text-success' :
                  r.status === 'pending' ? 'bg-warning/10 text-warning' :
                  'bg-destructive/10 text-destructive'
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
function MembershipTab({ membership, brand }: { membership: any; brand: any }) {
  if (!membership) {
    return (
      <div className="text-center py-16">
        <CreditCard size={48} className="mx-auto text-muted-foreground/30 mb-4" />
        <p className="text-sm text-muted-foreground">No tienes una membresía activa en este negocio</p>
        <p className="text-xs text-muted-foreground mt-2">Consulta con el negocio para conocer los planes disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: `${brand.primary}15` }}>
          <Crown size={24} style={{ color: brand.primary }} />
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">
            {membership.plan_name || (membership.is_plus ? 'Membresía Plus' : 'Membresía')}
          </p>
          <span className={`inline-block text-xs font-mono font-semibold px-3 py-1 rounded-lg mt-2 ${
            membership.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
          }`}>
            {membership.status === 'active' ? 'Activa' : membership.status}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm">
        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Beneficios</p>
        <div className="space-y-2.5">
          {membership.points_multiplier > 1 && (
            <div className="flex items-center gap-2.5">
              <Star size={14} style={{ color: brand.primary }} />
              <span className="text-sm text-foreground">Multiplicador de puntos: <strong>{membership.points_multiplier}x</strong></span>
            </div>
          )}
          {membership.bonus_points > 0 && (
            <div className="flex items-center gap-2.5">
              <Gift size={14} style={{ color: brand.primary }} />
              <span className="text-sm text-foreground">Puntos bonus: <strong>+{membership.bonus_points}</strong></span>
            </div>
          )}
          {membership.started_at && (
            <div className="flex items-center gap-2.5">
              <History size={14} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Desde: {new Date(membership.started_at).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
          {membership.ends_at && (
            <div className="flex items-center gap-2.5">
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
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={24} className="text-muted-foreground" />
          )}
        </div>
        <label className="text-sm text-primary font-semibold hover:underline cursor-pointer">
          Cambiar foto
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </label>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Nombre</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Teléfono</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Email</label>
        <p className="text-sm font-mono text-foreground">{user?.email}</p>
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </div>
  );
}

export default CustomerDashboard;
