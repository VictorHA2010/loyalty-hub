import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, Building2, Palette, Award, Globe } from 'lucide-react';

const BUSINESS_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'cafeteria', label: 'Cafetería' },
  { value: 'barberia', label: 'Barbería' },
  { value: 'gimnasio', label: 'Gimnasio' },
  { value: 'tienda', label: 'Tienda' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'clinica', label: 'Clínica' },
  { value: 'salon', label: 'Salón de belleza' },
  { value: 'farmacia', label: 'Farmacia' },
  { value: 'otro', label: 'Otro' },
];

const PlatformBusinessEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: biz, isLoading } = useQuery({
    queryKey: ['platform-biz-edit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: loyalty, isLoading: loyaltyLoading } = useQuery({
    queryKey: ['platform-loyalty', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('business_id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const [form, setForm] = useState({
    name: '',
    slug: '',
    logo_url: '',
    primary_color: '#1F7A63',
    secondary_color: '#2FA886',
    accent_color: '#66C2A5',
    banner_image: '',
    welcome_message: '',
    short_description: '',
    business_type: 'general',
    custom_domain: '',
  });

  const [loyaltyForm, setLoyaltyForm] = useState({
    base_points_per_purchase: 1,
    free_bonus_points: 0,
    membership_points_multiplier: 1,
  });

  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (biz && !initialized) {
      setForm({
        name: biz.name || '',
        slug: biz.slug || '',
        logo_url: (biz as any).logo_url || '',
        primary_color: (biz as any).primary_color || '#1F7A63',
        secondary_color: (biz as any).secondary_color || '#2FA886',
        accent_color: (biz as any).accent_color || '#66C2A5',
        banner_image: (biz as any).banner_image || '',
        welcome_message: (biz as any).welcome_message || '',
        short_description: (biz as any).short_description || '',
        business_type: (biz as any).business_type || 'general',
        custom_domain: (biz as any).custom_domain || '',
      });
      setInitialized(true);
    }
  }, [biz, initialized]);

  useEffect(() => {
    if (loyalty) {
      setLoyaltyForm({
        base_points_per_purchase: loyalty.base_points_per_purchase,
        free_bonus_points: loyalty.free_bonus_points,
        membership_points_multiplier: Number(loyalty.membership_points_multiplier),
      });
    }
  }, [loyalty]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: form.name,
          slug: form.slug,
          logo_url: form.logo_url || null,
          primary_color: form.primary_color,
          secondary_color: form.secondary_color,
          welcome_message: form.welcome_message,
          short_description: form.short_description || null,
          business_type: form.business_type,
          custom_domain: form.custom_domain || null,
        } as any)
        .eq('id', id!);
      if (error) throw error;

      // Upsert loyalty settings
      const { error: loyaltyErr } = await supabase
        .from('loyalty_settings')
        .upsert({
          business_id: id!,
          base_points_per_purchase: loyaltyForm.base_points_per_purchase,
          free_bonus_points: loyaltyForm.free_bonus_points,
          membership_points_multiplier: loyaltyForm.membership_points_multiplier,
        }, { onConflict: 'business_id' });
      if (loyaltyErr) throw loyaltyErr;

      queryClient.invalidateQueries({ queryKey: ['platform-biz-edit'] });
      queryClient.invalidateQueries({ queryKey: ['platform-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['platform-loyalty'] });
      toast.success('Configuración guardada');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const publicUrl = `${window.location.origin}/b/${form.slug || biz?.slug}`;
  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('URL copiada');
  };

  if (isLoading || loyaltyLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (!biz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Building2 size={40} className="mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Negocio no encontrado</p>
          <Button variant="outline" onClick={() => navigate('/platform')}>Volver</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/platform')} className="p-2 text-muted-foreground hover:bg-secondary rounded-md">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Personalizar negocio</h1>
            <p className="text-xs text-muted-foreground font-mono">{biz.name}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Public URL */}
        <div className="border border-border rounded-md p-4 bg-card">
          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Globe size={12} /> URL pública</p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-foreground flex-1 truncate">{publicUrl}</code>
            <button onClick={copyUrl} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md">
              <Copy size={16} />
            </button>
          </div>
        </div>

        {/* Section: Información básica */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Building2 size={16} /> Información del negocio
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mi Negocio" />
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="mi-negocio" />
            </div>
            <div className="space-y-1">
              <Label>Tipo de negocio</Label>
              <Select value={form.business_type} onValueChange={(v) => setForm({ ...form, business_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>URL del logo</Label>
              <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Descripción corta</Label>
            <Input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} placeholder="Breve descripción del negocio" />
          </div>
          <div className="space-y-1">
            <Label>Mensaje de bienvenida</Label>
            <Textarea value={form.welcome_message} onChange={(e) => setForm({ ...form, welcome_message: e.target.value })} placeholder="Bienvenido a nuestro programa de lealtad" rows={3} />
          </div>
        </section>

        {/* Section: Branding */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Palette size={16} /> Branding
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Color principal</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  className="w-10 h-10 rounded border border-border cursor-pointer"
                />
                <Input
                  value={form.primary_color}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  className="flex-1 font-mono"
                  placeholder="#6366f1"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Color secundario</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.secondary_color}
                  onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                  className="w-10 h-10 rounded border border-border cursor-pointer"
                />
                <Input
                  value={form.secondary_color}
                  onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                  className="flex-1 font-mono"
                  placeholder="#f59e0b"
                />
              </div>
            </div>
          </div>
          {/* Preview */}
          <div className="border border-border rounded-md p-4 bg-card">
            <p className="text-xs text-muted-foreground mb-2">Vista previa de colores</p>
            <div className="flex gap-3">
              <div className="flex-1 h-12 rounded-md flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: form.primary_color }}>
                Principal
              </div>
              <div className="flex-1 h-12 rounded-md flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: form.secondary_color }}>
                Secundario
              </div>
            </div>
          </div>
        </section>

        {/* Section: Dominio personalizado (preparado) */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Globe size={16} /> Dominio personalizado
          </h2>
          <div className="space-y-1">
            <Label>Dominio (preparado para futuro)</Label>
            <Input value={form.custom_domain} onChange={(e) => setForm({ ...form, custom_domain: e.target.value })} placeholder="www.minegocio.com" />
            <p className="text-xs text-muted-foreground">Este campo se usará cuando se implemente white-label.</p>
          </div>
        </section>

        {/* Section: Reglas de puntos */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Award size={16} /> Reglas de puntos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Puntos base por compra</Label>
              <Input
                type="number"
                min={0}
                value={loyaltyForm.base_points_per_purchase}
                onChange={(e) => setLoyaltyForm({ ...loyaltyForm, base_points_per_purchase: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Puntos de regalo</Label>
              <Input
                type="number"
                min={0}
                value={loyaltyForm.free_bonus_points}
                onChange={(e) => setLoyaltyForm({ ...loyaltyForm, free_bonus_points: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Multiplicador membresía</Label>
              <Input
                type="number"
                min={1}
                step={0.1}
                value={loyaltyForm.membership_points_multiplier}
                onChange={(e) => setLoyaltyForm({ ...loyaltyForm, membership_points_multiplier: Number(e.target.value) })}
              />
            </div>
          </div>
        </section>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  );
};

export default PlatformBusinessEdit;
