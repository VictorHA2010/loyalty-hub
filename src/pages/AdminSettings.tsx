import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';

const AdminSettings = () => {
  const { businessContext } = useAuth();
  const queryClient = useQueryClient();

  const { data: business, isLoading } = useQuery({
    queryKey: ['business-detail', businessContext?.businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessContext!.businessId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!businessContext?.businessId,
  });

  const [form, setForm] = useState({ name: '', slug: '', logo_url: '' });
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (business && !initialized) {
      setForm({
        name: business.name || '',
        slug: business.slug || '',
        logo_url: business.logo_url || '',
      });
      setInitialized(true);
    }
  }, [business, initialized]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ name: form.name, slug: form.slug, logo_url: form.logo_url || null })
        .eq('id', businessContext!.businessId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['business-detail'] });
      toast.success('Configuración guardada');
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
          <Skeleton className="h-10 w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="admin">
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold text-foreground mb-6">Configuración</h1>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Nombre del negocio</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre visible"
            />
          </div>
          <div className="space-y-1">
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="mi-negocio"
            />
          </div>
          <div className="space-y-1">
            <Label>URL del logo</Label>
            <Input
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="https://..."
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
