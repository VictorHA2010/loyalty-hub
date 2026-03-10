import { useBusiness } from '@/contexts/BusinessContext';
import { useAdminDashboardMetrics, useBusinessActivity, useBonusPointsMetrics } from '@/hooks/useData';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/components/AppLayout';
import { Users, TrendingUp, Gift, Activity, Sparkles } from 'lucide-react';

const AdminDashboard = () => {
  const { business } = useBusiness();
  const businessId = business?.id;
  const metrics = useAdminDashboardMetrics(businessId);
  const bonus = useBonusPointsMetrics(businessId);
  const { data: activity, isLoading: activityLoading } = useBusinessActivity(businessId);

  const cards = [
    { label: 'Clientes registrados', value: metrics.customersCount, icon: <Users size={20} /> },
    { label: 'Movimientos hoy', value: metrics.movementsTodayCount, icon: <Activity size={20} /> },
    { label: 'Puntos emitidos hoy', value: metrics.pointsEarnedToday, icon: <TrendingUp size={20} /> },
    { label: 'Canjes hoy', value: metrics.redemptionsTodayCount, icon: <Gift size={20} /> },
    { label: 'Bonus emitidos hoy', value: bonus.bonusToday, icon: <Sparkles size={20} /> },
    { label: 'Bonus emitidos total', value: bonus.bonusTotal, icon: <Sparkles size={20} /> },
  ];

  return (
    <AppLayout role="admin">
      <div className="max-w-4xl">
        <h1 className="text-xl font-semibold text-foreground mb-6">Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {cards.map((card) => (
            <div key={card.label} className="border border-border rounded-md p-4 bg-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                {card.icon}
                <span className="text-xs">{card.label}</span>
              </div>
              {metrics.isLoading || bonus.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-semibold font-mono text-foreground">{card.value}</p>
              )}
            </div>
          ))}
        </div>

        <h2 className="text-lg font-semibold text-foreground mb-4">Actividad reciente</h2>
        {activityLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : activity && activity.length > 0 ? (
          <div className="space-y-1">
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  {entry.type !== 'earn' && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      entry.type === 'bonus' ? 'bg-primary/10 text-primary'
                      : entry.type === 'redeem' ? 'bg-destructive/10 text-destructive'
                      : 'bg-secondary text-muted-foreground'
                    }`}>
                      {entry.type === 'bonus' ? '🎁 Bonus' : entry.type === 'redeem' ? '🎟️ Canje' : entry.type === 'referral' ? '👥 Referido' : entry.type === 'promotion' ? '🎉 Promo' : entry.type === 'adjustment' ? '📝 Ajuste' : entry.type === 'membership' ? '⭐ Membresía' : entry.type}
                    </span>
                  )}
                  <div>
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{(entry.profiles as any)?.full_name || 'Usuario'}</span>
                      {' — '}
                      {entry.note || entry.type}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">
                      {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-mono font-medium ${entry.points >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                  {entry.points >= 0 ? '+' : ''}{entry.points}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Sin actividad reciente</p>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
