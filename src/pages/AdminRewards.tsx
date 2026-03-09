import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAllRewards } from '@/hooks/useData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';

const AdminRewards = () => {
  const { orgContext } = useAuth();
  const { data: rewards, isLoading } = useAllRewards(orgContext?.organizationId);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', points_cost: '' });

  const resetForm = () => {
    setForm({ name: '', description: '', points_cost: '' });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const { error } = await supabase.from('rewards').update({
          name: form.name,
          description: form.description,
          points_cost: parseInt(form.points_cost),
        }).eq('id', editing);
        if (error) throw error;
        toast.success('Recompensa actualizada');
      } else {
        const { error } = await supabase.from('rewards').insert({
          organization_id: orgContext!.organizationId,
          name: form.name,
          description: form.description,
          points_cost: parseInt(form.points_cost),
        });
        if (error) throw error;
        toast.success('Recompensa creada');
      }
      queryClient.invalidateQueries({ queryKey: ['all-rewards'] });
      resetForm();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase.from('rewards').update({ active: !current }).eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['all-rewards'] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const startEdit = (reward: any) => {
    setForm({ name: reward.name, description: reward.description || '', points_cost: String(reward.points_cost) });
    setEditing(reward.id);
    setShowForm(true);
  };

  return (
    <AppLayout role="admin">
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-foreground">Recompensas</h1>
          <Button onClick={() => { resetForm(); setShowForm(!showForm); }} size="sm">
            <Plus size={16} className="mr-1" />
            Nueva
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="border border-border rounded-md p-4 bg-card mb-6 space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Costo en puntos</Label>
              <Input type="number" value={form.points_cost} onChange={(e) => setForm({ ...form, points_cost: e.target.value })} required min={1} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm">{editing ? 'Actualizar' : 'Crear'}</Button>
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : rewards && rewards.length > 0 ? (
          <div className="space-y-2">
            {rewards.map((r) => (
              <div key={r.id} className="flex items-center justify-between border border-border rounded-md p-4 bg-card">
                <div>
                  <p className={`text-sm font-medium ${r.active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                    {r.name}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground">{r.points_cost} pts</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(r)} className="p-2 text-muted-foreground hover:bg-secondary rounded-md">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => toggleActive(r.id, r.active)} className="p-2 text-muted-foreground hover:bg-secondary rounded-md">
                    {r.active ? <ToggleRight size={18} className="text-primary" /> : <ToggleLeft size={18} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Sin recompensas</p>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminRewards;
