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
import { Plus, ToggleLeft, ToggleRight, LogOut, Building2, UserPlus, ExternalLink, Settings2, Copy } from 'lucide-react';

const PlatformDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '' });
  const [creating, setCreating] = useState(false);

  // Assign admin state
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
      // Find user by email using security definer function
      const { data: profileResult, error: profileErr } = await supabase
        .rpc('find_profile_by_email', { _email: adminEmail.trim() });
      if (profileErr) throw profileErr;
      if (!profileResult || profileResult.length === 0) {
        toast.error('Usuario no encontrado. Debe registrarse primero.');
        return;
      }
      const profile = profileResult[0];

      // Insert role
      const { error: roleErr } = await supabase.from('user_roles').insert({
        user_id: profile.id,
        business_id: assignBizId,
        role: 'business_admin' as any,
      });
      if (roleErr) throw roleErr;

      // Also add to business_members
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Plataforma</h1>
            <p className="text-xs text-muted-foreground font-mono">platform_admin</p>
          </div>
          <button onClick={handleSignOut} className="p-2 text-muted-foreground hover:bg-secondary rounded-md">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Negocios</h2>
          <Button onClick={() => setShowCreate(!showCreate)} size="sm">
            <Plus size={16} className="mr-1" /> Nuevo negocio
          </Button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="border border-border rounded-md p-4 bg-card mb-6 space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mi Negocio" required />
            </div>
            <div className="space-y-1">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="mi-negocio" required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={creating}>{creating ? 'Creando...' : 'Crear'}</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancelar</Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : businesses && businesses.length > 0 ? (
          <div className="space-y-2">
            {businesses.map((biz: any) => (
              <div key={biz.id} className="border border-border rounded-md p-4 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 size={20} className="text-muted-foreground" />
                    <div>
                      <p className={`font-medium ${biz.active !== false ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                        {biz.name}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">{biz.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/b/${biz.slug}`);
                        toast.success('URL copiada');
                      }}
                      className="p-2 text-muted-foreground hover:bg-secondary rounded-md"
                      title="Copiar enlace"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => navigate(`/platform/business/${biz.id}`)}
                      className="p-2 text-muted-foreground hover:bg-secondary rounded-md"
                      title="Personalizar"
                    >
                      <Settings2 size={16} />
                    </button>
                    <button
                      onClick={() => navigate(`/admin/${biz.slug}`)}
                      className="p-2 text-muted-foreground hover:bg-secondary rounded-md"
                      title="Abrir negocio"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      onClick={() => setAssignBizId(assignBizId === biz.id ? null : biz.id)}
                      className="p-2 text-muted-foreground hover:bg-secondary rounded-md"
                      title="Asignar administrador"
                    >
                      <UserPlus size={16} />
                    </button>
                    <button
                      onClick={() => toggleActive(biz.id, biz.active !== false)}
                      className="p-2 text-muted-foreground hover:bg-secondary rounded-md"
                    >
                      {biz.active !== false ? <ToggleRight size={18} className="text-primary" /> : <ToggleLeft size={18} />}
                    </button>
                  </div>
                </div>

                {assignBizId === biz.id && (
                  <form onSubmit={handleAssignAdmin} className="mt-3 pt-3 border-t border-border flex gap-2">
                    <Input
                      type="email"
                      placeholder="Email del administrador"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      className="flex-1"
                    />
                    <Button type="submit" size="sm" disabled={assigning}>
                      {assigning ? '...' : 'Asignar'}
                    </Button>
                  </form>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No hay negocios creados</p>
        )}
      </div>
    </div>
  );
};

export default PlatformDashboard;
