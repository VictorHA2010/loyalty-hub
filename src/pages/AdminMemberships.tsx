import { useState } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useMembershipPlans, useBusinessMemberships, useBusinessCustomers } from '@/hooks/useData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Crown, Plus, Pencil, X, UserPlus, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';

interface PlanForm {
  name: string;
  description: string;
  points_multiplier: number;
  bonus_points: number;
  is_plus: boolean;
  active: boolean;
}

const emptyPlan: PlanForm = { name: '', description: '', points_multiplier: 1, bonus_points: 0, is_plus: false, active: true };

const AdminMemberships = () => {
  const { business } = useBusiness();
  const businessId = business?.id;
  const { data: plans, isLoading: plansLoading } = useMembershipPlans(businessId);
  const { data: memberships, isLoading: membershipsLoading } = useBusinessMemberships(businessId);
  const { data: customers } = useBusinessCustomers(businessId);
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyPlan);
  const [saving, setSaving] = useState(false);

  // Assign modal
  const [assignPlanId, setAssignPlanId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['membership-plans'] });
    queryClient.invalidateQueries({ queryKey: ['business-memberships'] });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyPlan);
    setShowForm(true);
  };

  const openEdit = (plan: any) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description || '',
      points_multiplier: plan.points_multiplier,
      bonus_points: plan.bonus_points,
      is_plus: plan.is_plus,
      active: plan.active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase.from('membership_plans').update({
          name: form.name.trim(),
          description: form.description.trim() || null,
          points_multiplier: form.points_multiplier,
          bonus_points: form.bonus_points,
          is_plus: form.is_plus,
          active: form.active,
        } as any).eq('id', editingId);
        if (error) throw error;
        toast.success('Plan actualizado');
      } else {
        const { error } = await supabase.from('membership_plans').insert({
          business_id: businessId!,
          name: form.name.trim(),
          description: form.description.trim() || null,
          points_multiplier: form.points_multiplier,
          bonus_points: form.bonus_points,
          is_plus: form.is_plus,
          active: form.active,
        } as any);
        if (error) throw error;
        toast.success('Plan creado');
      }
      invalidate();
      setShowForm(false);
      setEditingId(null);
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const deletePlan = async (id: string) => {
    if (!confirm('¿Eliminar este plan?')) return;
    try {
      const { error } = await supabase.from('membership_plans').delete().eq('id', id);
      if (error) throw error;
      invalidate();
      toast.success('Plan eliminado');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleAssign = async () => {
    if (!assignPlanId || !assignUserId) { toast.error('Selecciona un cliente'); return; }
    setAssigning(true);
    try {
      const plan = plans?.find((p: any) => p.id === assignPlanId);
      // Check if customer already has a membership in this business
      const { data: existing } = await supabase
        .from('memberships')
        .select('id')
        .eq('business_id', businessId!)
        .eq('user_id', assignUserId)
        .maybeSingle();

      if (existing) {
        // Update existing membership
        const { error } = await supabase.from('memberships').update({
          plan_id: assignPlanId,
          plan_name: plan?.name || null,
          is_plus: plan?.is_plus || false,
          points_multiplier: plan?.points_multiplier || 1,
          bonus_points: plan?.bonus_points || 0,
          status: 'active',
          started_at: new Date().toISOString(),
        } as any).eq('id', existing.id);
        if (error) throw error;
        toast.success('Membresía actualizada');
      } else {
        // Create new membership
        const { error } = await supabase.from('memberships').insert({
          business_id: businessId!,
          user_id: assignUserId,
          plan_id: assignPlanId,
          plan_name: plan?.name || null,
          is_plus: plan?.is_plus || false,
          points_multiplier: plan?.points_multiplier || 1,
          bonus_points: plan?.bonus_points || 0,
          status: 'active',
          started_at: new Date().toISOString(),
        } as any);
        if (error) throw error;
        toast.success('Membresía asignada');
      }
      invalidate();
      setAssignPlanId(null);
      setAssignUserId('');
    } catch (err: any) { toast.error(err.message); }
    finally { setAssigning(false); }
  };

  const toggleMembershipStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase.from('memberships').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      invalidate();
      toast.success(`Membresía ${newStatus === 'active' ? 'activada' : 'desactivada'}`);
    } catch (err: any) { toast.error(err.message); }
  };

  const removeMembership = async (id: string) => {
    if (!confirm('¿Eliminar esta membresía del cliente?')) return;
    try {
      const { error } = await supabase.from('memberships').delete().eq('id', id);
      if (error) throw error;
      invalidate();
      toast.success('Membresía eliminada');
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <AppLayout role="admin">
      <div className="max-w-3xl space-y-8">
        {/* ═══ PLANS SECTION ═══ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-foreground">Planes de membresía</h1>
            <Button size="sm" onClick={openCreate}>
              <Plus size={14} className="mr-1" /> Nuevo plan
            </Button>
          </div>

          {/* Plan form */}
          {showForm && (
            <div className="border border-border rounded-lg bg-card p-5 mb-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{editingId ? 'Editar plan' : 'Nuevo plan'}</p>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Nombre *</label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Plan Premium" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Descripción</label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción corta" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Multiplicador de puntos</label>
                  <Input type="number" min={1} step={0.5} value={form.points_multiplier} onChange={(e) => setForm({ ...form, points_multiplier: parseFloat(e.target.value) || 1 })} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Puntos bonus</label>
                  <Input type="number" min={0} value={form.bonus_points} onChange={(e) => setForm({ ...form, bonus_points: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Switch checked={form.is_plus} onCheckedChange={(v) => setForm({ ...form, is_plus: v })} />
                  Plan Plus
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                  Activo
                </label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
                {saving ? 'Guardando...' : editingId ? 'Actualizar plan' : 'Crear plan'}
              </Button>
            </div>
          )}

          {/* Plans list */}
          {plansLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : plans && plans.length > 0 ? (
            <div className="space-y-2">
              {plans.map((plan: any) => (
                <div key={plan.id} className="border border-border rounded-lg p-4 bg-card flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                      {plan.is_plus && <Crown size={14} className="text-primary" />}
                      {!plan.active && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Inactivo</span>}
                    </div>
                    {plan.description && <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-mono text-muted-foreground">x{plan.points_multiplier}</span>
                      {plan.bonus_points > 0 && <span className="text-xs font-mono text-muted-foreground">+{plan.bonus_points} bonus</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setAssignPlanId(plan.id)} title="Asignar a cliente">
                      <UserPlus size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(plan)} title="Editar">
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deletePlan(plan.id)} title="Eliminar" className="text-destructive hover:text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No hay planes creados. Crea uno para empezar.</p>
          )}
        </section>

        {/* ═══ ASSIGN MODAL ═══ */}
        {assignPlanId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Asignar membresía</p>
                <button onClick={() => { setAssignPlanId(null); setAssignUserId(''); }} className="text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Plan: <strong>{plans?.find((p: any) => p.id === assignPlanId)?.name}</strong>
              </p>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Seleccionar cliente</label>
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">— Seleccionar —</option>
                  {customers?.map((c: any) => (
                    <option key={c.user_id} value={c.user_id}>
                      {c.profiles?.full_name || c.profiles?.email || c.user_id}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleAssign} disabled={assigning || !assignUserId} className="w-full">
                {assigning ? 'Asignando...' : 'Asignar membresía'}
              </Button>
            </div>
          </div>
        )}

        {/* ═══ ASSIGNED MEMBERSHIPS ═══ */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Membresías asignadas</h2>
          {membershipsLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : memberships && memberships.length > 0 ? (
            <div className="space-y-2">
              {memberships.map((m: any) => (
                <div key={m.id} className="border border-border rounded-lg p-4 bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{m.profiles?.full_name || 'Sin nombre'}</p>
                        {m.is_plus && <Crown size={14} className="text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{m.profiles?.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-mono text-muted-foreground">{m.plan_name || 'Sin plan'}</span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${m.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          {m.status === 'active' ? 'Activa' : 'Inactiva'}
                        </span>
                        {m.points_multiplier > 1 && <span className="text-xs font-mono text-primary">x{m.points_multiplier}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => toggleMembershipStatus(m.id, m.status)}>
                        {m.status === 'active' ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeMembership(m.id)} className="text-destructive hover:text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No hay membresías asignadas</p>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default AdminMemberships;
