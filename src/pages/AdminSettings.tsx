import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgSettings } from '@/hooks/useData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';

const AdminSettings = () => {
  const { orgContext } = useAuth();
  const { data: settings, isLoading } = useOrgSettings(orgContext?.organizationId);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    brand_name: '',
    primary_color: '',
    secondary_color: '',
    accent_color: '',
  });
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings && !initialized) {
      setForm({
        brand_name: settings.brand_name || '',
        primary_color: settings.primary_color || '',
        secondary_color: settings.secondary_color || '',
        accent_color: settings.accent_color || '',
      });
      setInitialized(true);
    }
  }, [settings, initialized]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings) {
        const { error } = await supabase
          .from('organization_settings')
          .update(form)
          .eq('organization_id', orgContext!.organizationId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organization_settings')
          .insert({ ...form, organization_id: orgContext!.organizationId });
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['org-settings'] });
      toast.success('Configuración guardada');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout role="admin">
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold text-foreground mb-6">Configuración</h1>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Nombre de marca</Label>
            <Input
              value={form.brand_name}
              onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
              placeholder="Nombre visible para clientes"
            />
          </div>
          <div className="space-y-1">
            <Label>Color primario</Label>
            <Input
              value={form.primary_color}
              onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
              placeholder="#007AFF"
            />
          </div>
          <div className="space-y-1">
            <Label>Color secundario</Label>
            <Input
              value={form.secondary_color}
              onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
              placeholder="#F7F7F7"
            />
          </div>
          <div className="space-y-1">
            <Label>Color de acento</Label>
            <Input
              value={form.accent_color}
              onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
              placeholder="#111111"
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminSettings;
