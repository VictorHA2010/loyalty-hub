import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, LogOut, Loader2, Building2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface BusinessRow {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  subscription_status: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  created_at: string;
}

const SuperAdminDashboard = () => {
  const { user, loading: authLoading, signOut, globalRole } = useAuth();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessRow | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || globalRole !== "platform_admin")) {
      navigate("/login");
    }
  }, [user, authLoading, globalRole, navigate]);

  useEffect(() => {
    if (globalRole === "platform_admin") {
      fetchBusinesses();
    }
  }, [globalRole]);

  const fetchBusinesses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("businesses")
      .select("id, name, slug, is_active, subscription_status, current_period_end, stripe_customer_id, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error cargando negocios");
      console.error(error);
    } else {
      setBusinesses((data as any) || []);
    }
    setLoading(false);
  };

  const handleActivate = (business: BusinessRow) => {
    setSelectedBusiness(business);
    setSelectedPlan("");
    setActivateDialogOpen(true);
  };

  const confirmActivation = async () => {
    if (!selectedBusiness || !selectedPlan) return;

    setActivating(true);
    const daysMap: Record<string, number> = {
      "1": 30,
      "6": 182,
      "12": 365,
    };
    const days = daysMap[selectedPlan];
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + days);

    const { error } = await supabase
      .from("businesses")
      .update({
        is_active: true,
        subscription_status: "manual_active",
        current_period_end: periodEnd.toISOString(),
      } as any)
      .eq("id", selectedBusiness.id);

    if (error) {
      toast.error("Error activando negocio");
      console.error(error);
    } else {
      toast.success(`${selectedBusiness.name} activado por ${selectedPlan} mes(es)`);
      setActivateDialogOpen(false);
      fetchBusinesses();
    }
    setActivating(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user || user.email !== SUPER_ADMIN_EMAIL) return null;

  const activeCount = businesses.filter((b) => b.is_active).length;
  const pendingCount = businesses.filter((b) => !b.is_active).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Shield size={18} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Super Admin</h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut size={16} className="mr-2" /> Salir
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 size={20} className="text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{businesses.length}</p>
                  <p className="text-xs text-muted-foreground">Total Negocios</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                  <p className="text-xs text-muted-foreground">Activos (Pagados)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle size={20} className="text-destructive" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Todos los Negocios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Negocio</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tipo Suscripción</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{b.slug}</TableCell>
                      <TableCell>
                        {b.is_active ? (
                          <Badge className="bg-primary/10 text-primary border-primary/20">Pagado</Badge>
                        ) : (
                          <Badge variant="destructive">Pendiente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {b.subscription_status || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {b.current_period_end
                          ? new Date(b.current_period_end).toLocaleDateString("es-MX")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleActivate(b)}>
                          Activar Manualmente
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {businesses.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay negocios registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Activation Dialog */}
      <Dialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activar Manualmente: {selectedBusiness?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Selecciona el periodo de activación
            </label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Elige un plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Mes (30 días)</SelectItem>
                <SelectItem value="6">6 Meses (182 días)</SelectItem>
                <SelectItem value="12">12 Meses (365 días)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmActivation} disabled={!selectedPlan || activating}>
              {activating ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" /> Activando...
                </>
              ) : (
                "Confirmar Activación"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminDashboard;
