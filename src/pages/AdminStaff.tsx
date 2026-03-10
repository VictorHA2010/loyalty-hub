import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessMembers } from '@/hooks/useData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';

const AdminStaff = () => {
  const { businessContext } = useAuth();
  const { data: members, isLoading } = useBusinessMembers(businessContext?.businessId);
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);

  const staffMembers = (members || []).filter((m) => m.role === 'staff');

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !businessContext) return;
    setAdding(true);
    try {
      // Find user by email
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .single();
      if (profileErr || !profile) {
        toast.error('Usuario no encontrado. Debe registrarse primero.');
        return;
      }

      // Check if already exists
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', profile.id)
        .eq('business_id', businessContext.businessId)
        .eq('role', 'staff' as any);

      if (existing && existing.length > 0) {
        toast.error('Este usuario ya es staff de este negocio.');
        return;
      }

      const { error: roleErr } = await supabase.from('user_roles').insert({
        user_id: profile.id,
        business_id: businessContext.businessId,
        role: 'staff' as any,
      });
      if (roleErr) throw roleErr;

      // Also add to business_members
      await supabase.from('business_members').insert({
        user_id: profile.id,
        business_id: businessContext.businessId,
        role: 'staff',
        status: 'active',
      });

      queryClient.invalidateQueries({ queryKey: ['business-members'] });
      setEmail('');
      setShowAdd(false);
      toast.success('Staff agregado');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase.from('user_roles').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['business-members'] });
      toast.success('Staff eliminado');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AppLayout role="admin">
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-foreground">Staff</h1>
          <Button onClick={() => setShowAdd(!showAdd)} size="sm">
            <Plus size={16} className="mr-1" /> Agregar staff
          </Button>
        </div>

        {showAdd && (
          <form onSubmit={handleAddStaff} className="border border-border rounded-md p-4 bg-card mb-6 space-y-3">
            <div className="space-y-1">
              <Label>Email del usuario</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@ejemplo.com"
                required
              />
              <p className="text-xs text-muted-foreground">El usuario debe estar registrado previamente.</p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={adding}>
                {adding ? 'Agregando...' : 'Agregar'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAdd(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : staffMembers.length > 0 ? (
          <div className="space-y-2">
            {staffMembers.map((m) => (
              <div key={m.id} className="flex items-center justify-between border border-border rounded-md p-4 bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden text-xs font-medium text-muted-foreground">
                    {(m.profiles as any)?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{(m.profiles as any)?.full_name || 'Sin nombre'}</p>
                    <p className="text-xs text-muted-foreground">{(m.profiles as any)?.email}</p>
                  </div>
                </div>
                <button onClick={() => handleRemove(m.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-secondary rounded-md">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Sin staff registrado</p>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminStaff;
