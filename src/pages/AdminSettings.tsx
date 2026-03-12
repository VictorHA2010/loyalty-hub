import { useState, useEffect } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Image, Megaphone } from 'lucide-react';
import AppLayout from '@/components/AppLayout';

const AdminSettings = () => {
  const { business } = useBusiness();
  const businessId = business?.id;
  const queryClient = useQueryClient();

  const { data: bizData, isLoading } = useQuery({
    queryKey: ['business-detail', businessId],
    queryFn: async () => {
      const { data, error } = await supabase.from('businesses').select('*').eq('id', businessId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });

  const [form, setForm] = useState({ name: '', slug: '', logo_url: '' });
  const [bannerForm, setBannerForm] = useState({
    banner_image: '',
    banner_title: '',
    banner_description: '',
    banner_link: '',
    banner_active: false,
  });
  const [saving, setSaving] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (bizData && !initialized) {
      setForm({ name: bizData.name || '', slug: bizData.slug || '', logo_url: bizData.logo_url || '' });
      setBannerForm({
        banner_image: (bizData as any).banner_image || '',
        banner_title: (bizData as any).banner_title || '',
        banner_description: (bizData as any).banner_description || '',
        banner_link: (bizData as any).banner_link || '',
        banner_active: (bizData as any).banner_active || false,
      });
      setInitialized(true);
    }
  }, [bizData, initialized]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('businesses').update({ name: form.name, slug: form.slug, logo_url: form.logo_url || null }).eq('id', businessId!);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['business-detail'] });
      toast.success('Configuración guardada');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleSaveBanner = async () => {
    setSavingBanner(true);
    try {
      const { error } = await supabase.from('businesses').update({
        banner_image: bannerForm.banner_image || null,
        banner_title: bannerForm.banner_title || null,
        banner_description: bannerForm.banner_description || null,
        banner_link: bannerForm.banner_link || null,
        banner_active: bannerForm.banner_active,
      } as any).eq('id', businessId!);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['business-detail'] });
      toast.success('Banner actualizado');
    } catch (err: any) { toast.error(err.message); }
    finally { setSavingBanner(false); }
  };

  const publicUrl = `${window.location.origin}/b/${bizData?.slug || business?.slug}`;
  const copyUrl = () => { navigator.clipboard.writeText(publicUrl); toast.success('URL copiada'); };

  if (isLoading) {
    return <AppLayout role="admin"><div className="max-w-lg space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full" /></div></AppLayout>;
  }

  return (
    <AppLayout role="admin">
      <div className="max-w-lg space-y-8">
        <h1 className="text-xl font-semibold text-foreground">Configuración</h1>

        <div className="border border-border rounded-md p-4 bg-card">
          <p className="text-xs text-muted-foreground mb-1">URL pública del negocio</p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-foreground flex-1 truncate">{publicUrl}</code>
            <button onClick={copyUrl} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md">
              <Copy size={16} />
            </button>
          </div>
        </div>

        {/* General settings */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Información general</h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre del negocio</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre visible" />
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="mi-negocio" />
            </div>
            <div className="space-y-1">
              <Label>URL del logo</Label>
              <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? 'Guardando...' : 'Guardar configuración'}</Button>
          </div>
        </section>

        {/* Banner / Promoción destacada */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Megaphone size={16} /> Promoción destacada
          </h2>
          <p className="text-xs text-muted-foreground">Configura un banner promocional visible para tus clientes en la app.</p>

          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
            <div>
              <p className="text-sm font-medium text-foreground">Banner activo</p>
              <p className="text-xs text-muted-foreground">Mostrar banner en la app del cliente</p>
            </div>
            <Switch
              checked={bannerForm.banner_active}
              onCheckedChange={(checked) => setBannerForm({ ...bannerForm, banner_active: checked })}
            />
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Imagen del banner (URL)</Label>
              <Input
                value={bannerForm.banner_image}
                onChange={(e) => setBannerForm({ ...bannerForm, banner_image: e.target.value })}
                placeholder="https://ejemplo.com/banner.jpg"
              />
            </div>
            <div className="space-y-1">
              <Label>Título de la promoción</Label>
              <Input
                value={bannerForm.banner_title}
                onChange={(e) => setBannerForm({ ...bannerForm, banner_title: e.target.value })}
                placeholder="2x1 en cappuccino los viernes"
              />
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Textarea
                value={bannerForm.banner_description}
                onChange={(e) => setBannerForm({ ...bannerForm, banner_description: e.target.value })}
                placeholder="Descripción corta de la promoción..."
                rows={2}
              />
            </div>
            <div className="space-y-1">
              <Label>Enlace (opcional)</Label>
              <Input
                value={bannerForm.banner_link}
                onChange={(e) => setBannerForm({ ...bannerForm, banner_link: e.target.value })}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">Si agregas un enlace, se mostrará un botón en el banner.</p>
            </div>
          </div>

          {/* Banner Preview */}
          {(bannerForm.banner_title || bannerForm.banner_image) && (
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <p className="text-xs text-muted-foreground px-3 py-2 border-b border-border">Vista previa</p>
              <div className="relative rounded-b-xl overflow-hidden">
                {bannerForm.banner_image && (
                  <img src={bannerForm.banner_image} alt="Banner" className="w-full h-32 object-cover" />
                )}
                <div className={`${bannerForm.banner_image ? 'absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent' : 'bg-muted'} p-4 flex flex-col justify-end`}>
                  {bannerForm.banner_title && (
                    <p className={`text-sm font-bold ${bannerForm.banner_image ? 'text-white' : 'text-foreground'}`}>{bannerForm.banner_title}</p>
                  )}
                  {bannerForm.banner_description && (
                    <p className={`text-xs mt-0.5 ${bannerForm.banner_image ? 'text-white/80' : 'text-muted-foreground'}`}>{bannerForm.banner_description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleSaveBanner} disabled={savingBanner} className="w-full">
            {savingBanner ? 'Guardando...' : 'Guardar banner'}
          </Button>
        </section>
      </div>
    </AppLayout>
  );
};

export default AdminSettings;
