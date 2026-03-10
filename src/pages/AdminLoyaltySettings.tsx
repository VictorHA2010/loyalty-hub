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
  const [form, setForm] = useState({ base_points_per_purchase: '1', free_bonus_points: '0', membership_points_multiplier: '1' });
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      setForm({
        base_points_per_purchase: String(settings.base_points_per_purchase),
        free_bonus_points: String(settings.free_bonus_points),
        membership_points_multiplier: String(settings.membership_points_multiplier),
      });
      setInitialized(true);
    }
  }, [settings, initialized]);

  const handleSave = async () => {
    if (!businessId) return;
    setSaving(true);
    try {
      const payload = {
        business_id: businessId,
        base_points_per_purchase: parseInt(form.base_points_per_purchase) || 1,
        free_bonus_points: parseInt(form.free_bonus_points) || 0,
        membership_points_multiplier: parseFloat(form.membership_points_multiplier) || 1,
        updated_at: new Date().toISOString(),
      };
      if (settings) {
        const { error } = await supabase.from('loyalty_settings').update(payload).eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('loyalty_settings').insert(payload);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['loyalty-settings'] });
      toast.success('Reglas de puntos guardadas');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (isLoading) {
    return <AppLayout role="admin"><div className="max-w-lg space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full" /></div></AppLayout>;
  }

  return (
    <AppLayout role="admin">
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold text-foreground mb-6">Reglas de puntos</h1>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Puntos base por compra</Label>
            <Input type="number" value={form.base_points_per_purchase} onChange={(e) => setForm({ ...form, base_points_per_purchase: e.target.value })} min={1} />
            <p className="text-xs text-muted-foreground">Puntos que recibe el cliente por cada compra.</p>
          </div>
          <div className="space-y-1">
            <Label>Puntos gratis / promocionales</Label>
            <Input type="number" value={form.free_bonus_points} onChange={(e) => setForm({ ...form, free_bonus_points: e.target.value })} min={0} />
            <p className="text-xs text-muted-foreground">Puntos extra promocionales que se agregan automáticamente.</p>
          </div>
          <div className="space-y-1">
            <Label>Multiplicador de membresía Plus</Label>
            <Input type="number" step="0.1" value={form.membership_points_multiplier} onChange={(e) => setForm({ ...form, membership_points_multiplier: e.target.value })} min={1} />
            <p className="text-xs text-muted-foreground">Los clientes Plus reciben puntos × este multiplicador.</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? 'Guardando...' : 'Guardar reglas'}</Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminLoyaltySettings;
