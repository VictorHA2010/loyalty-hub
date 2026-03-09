import { useAuth } from '@/contexts/AuthContext';
import { useBusinessActivity } from '@/hooks/useData';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/components/AppLayout';

const AdminActivity = () => {
  const { businessContext } = useAuth();
  const { data: activity, isLoading } = useBusinessActivity(businessContext?.businessId);

  return (
    <AppLayout role="admin">
      <div className="max-w-2xl">
        <h1 className="text-xl font-semibold text-foreground mb-6">Actividad reciente</h1>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : activity && activity.length > 0 ? (
          <div className="space-y-1">
            {activity.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
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

export default AdminActivity;
