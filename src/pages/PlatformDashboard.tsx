import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, ToggleLeft, ToggleRight, LogOut, Building2, UserPlus,
  ExternalLink, Settings2, Copy, Shield, LayoutGrid,
} from 'lucide-react';

const PlatformDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '' });
  const [creating, setCreating] = useState(false);
  const [assignBizId, setAssignBizId] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [assigning, setAssigning] = useState(false);

  const { data: businesses, isLoading } = useQuery({
    queryKey: ['platform-businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) return;
    setCreating(true);
    try {
      const { error } = await supabase.from('businesses').insert({
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['platform-businesses'] });
      setForm({ name: '', slug: '' });
      setShowCreate(false);
      toast.success('Negocio creado');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase.from('businesses').update({ active: current ? false : true } as any).eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['platform-businesses'] });
      toast.success(current ? 'Negocio desactivado' : 'Negocio activado');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignBizId || !adminEmail.trim()) return;
    setAssigning(true);
    try {
      const { data: profileResult, error: profileErr } = await supabase
        .rpc('find_profile_by_email', { _email: adminEmail.trim() });
      if (profileErr) throw profileErr;
      if (!profileResult || profileResult.length === 0) {
        toast.error('Usuario no encontrado. Debe registrarse primero.');
        return;
      }
      const profile = profileResult[0];

      const { error: roleErr } = await supabase.from('user_roles').insert({
        user_id: profile.id,
        business_id: assignBizId,
        role: 'business_admin' as any,
      });
      if (roleErr) throw roleErr;

      const { error: memberErr } = await supabase.from('business_members' as any).insert({
        user_id: profile.id,
        business_id: assignBizId,
        role: 'business_admin',
        status: 'active',
      });
      if (memberErr && !memberErr.message.includes('duplicate')) {
        console.warn('business_members insert warning:', memberErr.message);
      }

      toast.success('Administrador asignado');
      setAssignBizId(null);
      setAdminEmail('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const activeCount = businesses?.filter((b: any) => b.active !== false).length || 0;
  const totalCount = businesses?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Shield size={18} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">LoyaltyHub</h1>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Platform Admin</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <LayoutGrid size={18} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Total negocios</p>
            </div>
            <p className="text-3xl font-bold font-mono text-foreground">{isLoading ? '—' : totalCount}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Building2 size={18} className="text-success" />
              </div>
              <p className="text-sm text-muted-foreground">Activos</p>
            </div>
            <p className="text-3xl font-bold font-mono text-foreground">{isLoading ? '—' : activeCount}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-5 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Building2 size={18} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Inactivos</p>
            </div>
            <p className="text-3xl font-bold font-mono text-foreground">{isLoading ? '—' : totalCount - activeCount}</p>
          </div>
        </div>

        {/* Business list header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Negocios</h2>
          <Button onClick={() => setShowCreate(!showCreate)} size="sm" className="gap-1.5 font-semibold">
            <Plus size={16} /> Nuevo negocio
          </Button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="border border-border rounded-xl p-5 bg-card shadow-card mb-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Crear nuevo negocio</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombre</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mi Negocio" required className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="mi-negocio" required className="h-10" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={creating} className="font-semibold">{creating ? 'Creando...' : 'Crear negocio'}</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
              </div>
            </form>
          </div>
        )}

        {/* Business list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : businesses && businesses.length > 0 ? (
          <div className="space-y-3">
            {businesses.map((biz: any) => (
              <div key={biz.id} className="border border-border rounded-xl p-5 bg-card shadow-card hover:shadow-card-hover transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${biz.active !== false ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Building2 size={20} className={biz.active !== false ? 'text-primary' : 'text-muted-foreground'} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={`font-semibold ${biz.active !== false ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {biz.name}
                        </p>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${biz.active !== false ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {biz.active !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">/b/{biz.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/b/${biz.slug}`);
                        toast.success('URL copiada');
                      }}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="Copiar enlace"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => navigate(`/platform/business/${biz.id}`)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="Personalizar"
                    >
                      <Settings2 size={16} />
                    </button>
                    <button
                      onClick={() => navigate(`/admin/${biz.slug}`)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="Abrir negocio"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      onClick={() => setAssignBizId(assignBizId === biz.id ? null : biz.id)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                      title="Asignar administrador"
                    >
                      <UserPlus size={16} />
                    </button>
                    <button
                      onClick={() => toggleActive(biz.id, biz.active !== false)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      {biz.active !== false ? <ToggleRight size={20} className="text-primary" /> : <ToggleLeft size={20} />}
                    </button>
                  </div>
                </div>

                {assignBizId === biz.id && (
                  <form onSubmit={handleAssignAdmin} className="mt-4 pt-4 border-t border-border flex gap-2">
                    <Input
                      type="email"
                      placeholder="Email del administrador"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      className="flex-1 h-10"
                    />
                    <Button type="submit" size="sm" disabled={assigning} className="font-semibold">
                      {assigning ? '...' : 'Asignar'}
                    </Button>
                  </form>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">No hay negocios creados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformDashboard;
