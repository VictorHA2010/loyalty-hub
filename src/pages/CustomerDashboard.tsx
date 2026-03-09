import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, usePointsBalance, useRewards, usePointsHistory, useRedemptions } from '@/hooks/useData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Gift, History, LogOut, QrCode, User } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const CustomerDashboard = () => {
  const { user, businessContext, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: balance, isLoading: balanceLoading } = usePointsBalance(businessContext?.businessId);
  const { data: rewards, isLoading: rewardsLoading } = useRewards(businessContext?.businessId);
  const { data: history } = usePointsHistory(businessContext?.businessId);
  const { data: redemptions } = useRedemptions(businessContext?.businessId);
  const [tab, setTab] = useState<'rewards' | 'history' | 'profile'>('rewards');
  const [redeeming, setRedeeming] = useState<string | null>(null);

  if (!businessContext) {
    navigate('/select-business');
    return null;
  }

  const handleRedeem = async (rewardId: string, cost: number) => {
    if (balance === undefined || balance < cost) {
      toast.error('Puntos insuficientes');
      return;
    }
    setRedeeming(rewardId);
    try {
      const { error: redError } = await supabase.from('redemptions').insert({
        business_id: businessContext.businessId,
        user_id: user!.id,
        reward_id: rewardId,
        status: 'pending',
      });
      if (redError) throw redError;

      const { error: ptError } = await supabase.from('points_ledger').insert({
        business_id: businessContext.businessId,
        user_id: user!.id,
        points: -cost,
        type: 'redeem',
        note: 'reward_redemption',
      });
      if (ptError) throw ptError;

      queryClient.invalidateQueries({ queryKey: ['points-balance'] });
      queryClient.invalidateQueries({ queryKey: ['redemptions'] });
      toast.success('Canje solicitado');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRedeeming(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground font-mono">{businessContext.businessName}</p>
              <h1 className="text-lg font-semibold text-foreground">
                {profileLoading ? <Skeleton className="h-5 w-32" /> : (profile?.full_name || 'Usuario')}
              </h1>
            </div>
            <button onClick={handleSignOut} className="p-2 text-muted-foreground hover:bg-secondary rounded-md">
              <LogOut size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 border border-border rounded-md bg-background">
            <div className="flex-shrink-0 w-20 h-20 bg-secondary rounded-md flex items-center justify-center">
              <QrCode size={40} className="text-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Tu código QR</p>
              <p className="text-xs font-mono text-muted-foreground mt-1 break-all">
                {profile?.qr_token || '...'}
              </p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">Puntos disponibles</p>
            <p className="text-3xl font-semibold font-mono text-foreground">
              {balanceLoading ? <Skeleton className="h-9 w-20 mx-auto" /> : (balance ?? 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        <div className="flex border-b border-border">
          {[
            { key: 'rewards' as const, label: 'Recompensas', icon: <Gift size={16} /> },
            { key: 'history' as const, label: 'Historial', icon: <History size={16} /> },
            { key: 'profile' as const, label: 'Perfil', icon: <User size={16} /> },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors border-b-2 ${
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

        <div className="p-4">
          {tab === 'rewards' && (
            <div className="space-y-3">
              {rewardsLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
              ) : rewards && rewards.length > 0 ? (
                rewards.map((reward) => (
                  <div key={reward.id} className="border border-border rounded-md p-4 bg-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">{reward.name}</p>
                        {reward.description && (
                          <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                        )}
                        <p className="text-sm font-mono text-primary mt-2">{reward.points_cost} pts</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleRedeem(reward.id, reward.points_cost)}
                        disabled={redeeming === reward.id || (balance !== undefined && balance < reward.points_cost)}
                      >
                        {redeeming === reward.id ? '...' : 'Canjear'}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No hay recompensas disponibles</p>
              )}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-2">
              {history && history.length > 0 ? (
                history.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm text-foreground">{entry.note || entry.type}</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className={`text-sm font-mono font-medium ${entry.points >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                      {entry.points >= 0 ? '+' : ''}{entry.points}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Sin historial</p>
              )}

              {redemptions && redemptions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-foreground mb-3">Canjes</h3>
                  {redemptions.map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm text-foreground">{(r.rewards as any)?.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                        r.status === 'approved' ? 'bg-secondary text-foreground' :
                        r.status === 'pending' ? 'bg-secondary text-muted-foreground' :
                        'bg-secondary text-destructive'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'profile' && (
            <ProfileTab />
          )}
        </div>
      </div>
    </div>
  );
};

function ProfileTab() {
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
      const { error } = await supabase.from('profiles').update({
        full_name: fullName,
        phone: phone,
      }).eq('id', user!.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil actualizado');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = `${user!.id}/profile.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      
      const { error: updateErr } = await supabase.from('profiles').update({
        avatar_url: publicUrl,
      }).eq('id', user!.id);
      if (updateErr) throw updateErr;

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Foto actualizada');
    } catch (err: any) {
      toast.error(err.message);
    }
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
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">Teléfono</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        />
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
