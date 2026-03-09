import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useOrgRedemptions } from '@/hooks/useData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { QrCode, Plus, Check, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import AppLayout from '@/components/AppLayout';

const StaffScan = () => {
  const { orgContext } = useAuth();
  const [qrToken, setQrToken] = useState('');
  const [scannedUser, setScannedUser] = useState<any>(null);
  const [scannedBalance, setScannedBalance] = useState<number>(0);
  const [pointsToAssign, setPointsToAssign] = useState('');
  const [assigning, setAssigning] = useState(false);
  const queryClient = useQueryClient();

  const handleScan = async () => {
    if (!qrToken.trim()) return;
    try {
      // Find user by qr_token
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('qr_token', qrToken.trim())
        .single();
      if (error || !profile) {
        toast.error('Usuario no encontrado');
        return;
      }

      // Get balance
      const { data: points } = await supabase
        .from('points_ledger')
        .select('points')
        .eq('organization_id', orgContext!.organizationId)
        .eq('user_id', profile.id);

      const balance = (points || []).reduce((sum, r) => sum + r.points, 0);
      setScannedUser(profile);
      setScannedBalance(balance);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAssignPoints = async () => {
    const pts = parseInt(pointsToAssign);
    if (!pts || pts <= 0 || !scannedUser) return;
    setAssigning(true);
    try {
      const { error } = await supabase.from('points_ledger').insert({
        organization_id: orgContext!.organizationId,
        user_id: scannedUser.id,
        points: pts,
        type: 'earn',
        source: 'staff_assignment',
      });
      if (error) throw error;
      setScannedBalance((prev) => prev + pts);
      setPointsToAssign('');
      toast.success(`${pts} puntos asignados`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const dismissScan = () => {
    setScannedUser(null);
    setQrToken('');
    setPointsToAssign('');
  };

  return (
    <AppLayout role="staff">
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-semibold text-foreground mb-6">Escanear QR</h1>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Token QR del cliente"
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value)}
              className="font-mono"
            />
            <Button onClick={handleScan}>
              <QrCode size={18} />
            </Button>
          </div>

          {/* Scanned user overlay — "identity merge" */}
          {scannedUser && (
            <div className="animate-slide-up border border-border rounded-md bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                    {scannedUser.avatar_url ? (
                      <img src={scannedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <QrCode size={20} className="text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{scannedUser.full_name || 'Sin nombre'}</p>
                    <p className="text-lg font-mono text-foreground">{scannedBalance} pts</p>
                  </div>
                </div>
                <button onClick={dismissScan} className="p-2 text-muted-foreground hover:bg-secondary rounded-md">
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Puntos a asignar"
                  value={pointsToAssign}
                  onChange={(e) => setPointsToAssign(e.target.value)}
                  min={1}
                />
                <Button onClick={handleAssignPoints} disabled={assigning}>
                  <Plus size={18} className="mr-1" />
                  Asignar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default StaffScan;
