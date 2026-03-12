import { useBusiness } from '@/contexts/BusinessContext';
import { useAdminDashboardMetrics, useBusinessActivity, useBonusPointsMetrics } from '@/hooks/useData';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/components/AppLayout';
import { Users, TrendingUp, Gift, Activity, Sparkles, ArrowUpRight } from 'lucide-react';

const AdminDashboard = () => {
  const { business } = useBusiness();
  const businessId = business?.id;
  const metrics = useAdminDashboardMetrics(businessId);
  const bonus = useBonusPointsMetrics(businessId);
  const { data: activity, isLoading: activityLoading } = useBusinessActivity(businessId);

  const cards = [
    { label: 'Clientes registrados', value: metrics.customersCount, icon: <Users size={20} />, color: 'bg-primary/10 text-primary' },
    { label: 'Movimientos hoy', value: metrics.movementsTodayCount, icon: <Activity size={20} />, color: 'bg-accent/10 text-accent' },
    { label: 'Puntos emitidos hoy', value: metrics.pointsEarnedToday, icon: <TrendingUp size={20} />, color: 'bg-success/10 text-success' },
    { label: 'Canjes hoy', value: metrics.redemptionsTodayCount, icon: <Gift size={20} />, color: 'bg-warning/10 text-warning' },
    { label: 'Bonus emitidos hoy', value: bonus.bonusToday, icon: <Sparkles size={20} />, color: 'bg-primary/10 text-primary' },
    { label: 'Bonus emitidos total', value: bonus.bonusTotal, icon: <Sparkles size={20} />, color: 'bg-accent/10 text-accent' },
  ];

  return (
    <AppLayout role="admin">
      <div className="max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Resumen de actividad de tu negocio</p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {cards.map((card) => (
            <div key={card.label} className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                  {card.icon}
                </div>
                <ArrowUpRight size={14} className="text-muted-foreground/40" />
              </div>
              {metrics.isLoading || bonus.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-3xl font-bold font-mono text-foreground">{card.value}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Activity */}
        <div className="bg-card border border-border rounded-xl shadow-card">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-base font-bold text-foreground">Actividad reciente</h2>
          </div>
          <div className="p-5">
            {activityLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-0">
                {activity.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      {entry.type !== 'earn' && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                          entry.type === 'bonus' ? 'bg-primary/10 text-primary'
                          : entry.type === 'redeem' ? 'bg-destructive/10 text-destructive'
                          : 'bg-muted text-muted-foreground'
                        }`}>
                          {entry.type === 'bonus' ? '🎁 Bonus' : entry.type === 'redeem' ? '🎟️ Canje' : entry.type === 'referral' ? '👥 Referido' : entry.type === 'promotion' ? '🎉 Promo' : entry.type === 'adjustment' ? '📝 Ajuste' : entry.type === 'membership' ? '⭐ Membresía' : entry.type}
                        </span>
                      )}
                      <div>
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">{(entry.profiles as any)?.full_name || 'Usuario'}</span>
                          {' — '}
                          {entry.note || entry.type}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-mono font-bold ${entry.points >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {entry.points >= 0 ? '+' : ''}{entry.points}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Sin actividad reciente</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
