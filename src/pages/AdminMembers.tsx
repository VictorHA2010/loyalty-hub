import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgMembers } from '@/hooks/useData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';

const AdminMembers = () => {
  const { orgContext } = useAuth();
  const { data: members, isLoading } = useOrgMembers(orgContext?.organizationId);
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'staff' | 'customer'>('staff');
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      // Find user by email — we need to look up in profiles or auth
      // Since we can't query auth.users directly, we'll inform the admin
      toast.error('El usuario debe registrarse primero. Luego podrás agregarlo por su ID.');
      // For now, this is a simplified flow
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase.from('organization_users').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['org-members'] });
      toast.success('Miembro eliminado');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('organization_users')
        .update({ role: newRole as any })
        .eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['org-members'] });
      toast.success('Rol actualizado');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AppLayout role="admin">
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-foreground">Miembros</h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : members && members.length > 0 ? (
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between border border-border rounded-md p-4 bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden text-xs font-medium text-muted-foreground">
                    {(m.profiles as any)?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{(m.profiles as any)?.full_name || 'Sin nombre'}</p>
                    <p className="text-xs font-mono text-muted-foreground">{m.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    className="text-xs rounded border border-input bg-background px-2 py-1 text-foreground"
                  >
                    <option value="admin">admin</option>
                    <option value="staff">staff</option>
                    <option value="customer">customer</option>
                  </select>
                  <button onClick={() => handleRemove(m.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-secondary rounded-md">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Sin miembros</p>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminMembers;
