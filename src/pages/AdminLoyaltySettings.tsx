import { useState, useEffect } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useLoyaltySettings } from '@/hooks/useData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';

const AdminLoyaltySettings = () => {
  const { business } = useBusiness();
  const businessId = business?.id;
  const { data: settings, isLoading } = useLoyaltySettings(businessId);
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    base_points_per_purchase:      '1',
    free_bonus_points:             '0',
    membership_points_multiplier:  '2',
  });
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      setForm({
        base_points_per_purchase:      String(settings.base_points_per_purchase ?? 1),
        free_bonus_points:             String(settings.free_bonus_points ?? 0),
        membership_points_multiplier:  String(settings.membership_points_multiplier ?? 2),
      });
      setInitialized(true);
    }
  }, [settings, initialized]);

  const basePoints = parseInt(form.base_points_per_purchase) || 1;
  const bonus      = parseInt(form.free_bonus_points) || 0;
  const multiplier = parseFloat(form.membership_points_multiplier) || 2;

  const examplePoints = basePoints + bonus;
  const plusPoints     = Math.round(examplePoints * multiplier);

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    try {
      const payload = {
        business_id:                  businessId,
        base_points_per_purchase:     parseInt(form.base_points_per_purchase) || 1,
        free_bonus_points:            parseInt(form.free_bonus_points) || 0,
        membership_points_multiplier: parseFloat(form.membership_points_multiplier) || 2,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('loyalty_settings')
        .upsert({
          ...(settings?.id ? { id: settings.id } : {}),
          ...payload
        });

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['loyalty-settings'] });
      toast.success('Reglas de puntos guardadas');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout role="admin">
        <div className="max-w-lg space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="admin">
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold text-foreground mb-2">Reglas de puntos</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Define cómo se convierten las compras en puntos para tus clientes.
        </p>

        <div className="space-y-5">

          {/* Puntos base */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">💰 Puntos base por compra</p>
            <Input
              type="number"
              value={form.base_points_per_purchase}
              onChange={(e) => setForm({ ...form, base_points_per_purchase: e.target.value })}
              min={1}
            />
            <p className="text-xs text-muted-foreground">
              Puntos que se otorgan por cada transacción registrada.
            </p>
          </div>

          {/* Bonus */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">🎁 Puntos extra por transacción</p>
            <Input
              type="number"
              value={form.free_bonus_points}
              onChange={(e) => setForm({ ...form, free_bonus_points: e.target.value })}
              min={0}
            />
            <p className="text-xs text-muted-foreground">
              Puntos fijos que se suman en cada venta, sin importar el monto. Pon 0 para desactivar.
            </p>
          </div>

          {/* Membresía Plus */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">⭐ Multiplicador para miembros Plus</p>
            <Input
              type="number"
              step="0.1"
              value={form.membership_points_multiplier}
              onChange={(e) => setForm({ ...form, membership_points_multiplier: e.target.value })}
              min={1}
            />
            <p className="text-xs text-muted-foreground">
              Los puntos calculados se multiplican por este número. Ejemplo: 2 = doble de puntos.
            </p>
          </div>

          {/* Preview dinámico */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-1">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Vista previa por compra</p>
            <p className="text-sm text-foreground">
              Cliente normal →{' '}
              <span className="font-bold text-primary">{examplePoints} puntos</span>
            </p>
            <p className="text-sm text-foreground">
              Cliente Plus (x{multiplier}) →{' '}
              <span className="font-bold text-primary">{plusPoints} puntos</span>
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Guardando...' : 'Guardar reglas'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminLoyaltySettings;
