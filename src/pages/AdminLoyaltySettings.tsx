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
    amount_base:                  '10',
    points_per_amount:            '1',
    points_bonus:                 '0',
    membership_points_multiplier: '2',
  });
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      setForm({
        amount_base:                  String(settings.amount_base                  ?? 10),
        points_per_amount:            String(settings.points_per_amount            ?? 1),
        points_bonus:                 String(settings.points_bonus                 ?? 0),
        membership_points_multiplier: String(settings.membership_points_multiplier ?? 2),
      });
      setInitialized(true);
    }
  }, [settings, initialized]);

  // Preview dinámico
  const amountBase   = parseFloat(form.amount_base)   || 10;
  const ptsPerAmount = parseFloat(form.points_per_amount) || 1;
  const bonus        = parseInt(form.points_bonus)    || 0;
  const multiplier   = parseFloat(form.membership_points_multiplier) || 2;

  const exampleAmount  = 100;
  const basePoints     = Math.round((exampleAmount / amountBase) * ptsPerAmount) + bonus;
  const plusPoints     = Math.round(basePoints * multiplier);

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    try {
      const payload = {
        business_id:                  businessId,
        amount_base:                  parseFloat(form.amount_base)   || 10,
        points_per_amount:            parseFloat(form.points_per_amount) || 1,
        points_bonus:                 parseInt(form.points_bonus)    || 0,
        membership_points_multiplier: parseFloat(form.membership_points_multiplier) || 2,
        updated_at: new Date().toISOString(),
      };
      if (settings) {
        const { error } = await supabase
          .from('loyalty_settings')
          .update(payload)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('loyalty_settings')
          .insert(payload);
        if (error) throw error;
      }
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

          {/* Conversión */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            <p className="text-sm font-medium text-foreground">💰 Conversión de compra a puntos</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Monto de referencia ($)</Label>
                <Input
                  type="number"
                  value={form.amount_base}
                  onChange={(e) => setForm({ ...form, amount_base: e.target.value })}
                  min={1}
                />
                <p className="text-xs text-muted-foreground">Cada cuánto dinero...</p>
              </div>
              <div className="space-y-1">
                <Label>Puntos a otorgar</Label>
                <Input
                  type="number"
                  value={form.points_per_amount}
                  onChange={(e) => setForm({ ...form, points_per_amount: e.target.value })}
                  min={1}
                />
                <p className="text-xs text-muted-foreground">...se dan estos puntos</p>
              </div>
            </div>

            <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Ejemplo: por cada{' '}
              <span className="font-semibold text-foreground">${amountBase}</span> el cliente recibe{' '}
              <span className="font-semibold text-foreground">{ptsPerAmount} pto{ptsPerAmount !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Bonus */}
          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">🎁 Puntos extra por transacción</p>
            <Input
              type="number"
              value={form.points_bonus}
              onChange={(e) => setForm({ ...form, points_bonus: e.target.value })}
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
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Vista previa con $100 de compra</p>
            <p className="text-sm text-foreground">
              Cliente normal →{' '}
              <span className="font-bold text-primary">{basePoints} puntos</span>
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