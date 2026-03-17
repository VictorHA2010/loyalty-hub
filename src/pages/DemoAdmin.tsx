import { useState } from 'react';
import { X, Users, TrendingUp, Gift, Activity, Sparkles, ArrowUpRight, LayoutDashboard, History, UserCheck, Crown, Sliders, Settings, CreditCard, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MOCK_METRICS = [
  { label: 'Clientes registrados', value: 247, icon: <Users size={20} />, color: 'bg-primary/10 text-primary' },
  { label: 'Movimientos hoy', value: 38, icon: <Activity size={20} />, color: 'bg-accent/10 text-accent' },
  { label: 'Puntos emitidos hoy', value: 1520, icon: <TrendingUp size={20} />, color: 'bg-green-500/10 text-green-600' },
  { label: 'Canjes hoy', value: 12, icon: <Gift size={20} />, color: 'bg-orange-500/10 text-orange-600' },
  { label: 'Bonus emitidos hoy', value: 340, icon: <Sparkles size={20} />, color: 'bg-primary/10 text-primary' },
  { label: 'Bonus emitidos total', value: 8750, icon: <Sparkles size={20} />, color: 'bg-accent/10 text-accent' },
];

const MOCK_ACTIVITY = [
  { id: '1', name: 'María García', type: 'earn', points: 10, note: 'Compra en sucursal Centro', time: 'Hace 5 min' },
  { id: '2', name: 'Carlos López', type: 'bonus', points: 50, note: 'Bonus de bienvenida', time: 'Hace 12 min' },
  { id: '3', name: 'Ana Martínez', type: 'redeem', points: -200, note: 'Canje: Café gratis', time: 'Hace 25 min' },
  { id: '4', name: 'Pedro Sánchez', type: 'earn', points: 15, note: 'Compra en sucursal Norte', time: 'Hace 1 hora' },
  { id: '5', name: 'Laura Díaz', type: 'membership', points: 100, note: 'Activación membresía Plus', time: 'Hace 2 horas' },
  { id: '6', name: 'Roberto Flores', type: 'referral', points: 25, note: 'Referido completado', time: 'Hace 3 horas' },
];

const MOCK_NAV = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, active: true },
  { label: 'Recompensas', icon: <Gift size={18} /> },
  { label: 'Staff', icon: <UserCheck size={18} /> },
  { label: 'Miembros', icon: <Users size={18} /> },
  { label: 'Clientes', icon: <Users size={18} /> },
  { label: 'Membresías', icon: <Crown size={18} /> },
  { label: 'Canjes', icon: <History size={18} /> },
  { label: 'Reglas de puntos', icon: <Sliders size={18} /> },
  { label: 'Configuración', icon: <Settings size={18} /> },
  { label: 'Planes', icon: <CreditCard size={18} /> },
];

interface DemoAdminProps {
  onClose: () => void;
}

const DemoAdmin = ({ onClose }: DemoAdminProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
              <Shield size={16} className="text-sidebar-primary" />
            </div>
            <span className="text-sm font-bold text-sidebar-foreground tracking-tight">LoyaltyHub</span>
          </div>
          <div className="bg-sidebar-accent rounded-lg px-3 py-2">
            <p className="text-xs font-semibold text-sidebar-foreground">Mi Cafetería Demo</p>
            <p className="text-[10px] font-mono text-sidebar-muted mt-0.5 uppercase tracking-wider">Administrador</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider px-3 mb-2">Menú</p>
          {MOCK_NAV.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all cursor-default ${
                item.active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/70'
              }`}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with close */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">DEMO — Vista Admin</span>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="gap-2">
            <X size={14} />
            Cerrar demo
          </Button>
        </div>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-5xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Resumen de actividad de tu negocio</p>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {MOCK_METRICS.map((card) => (
                <div key={card.label} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                      {card.icon}
                    </div>
                    <ArrowUpRight size={14} className="text-muted-foreground/40" />
                  </div>
                  <p className="text-3xl font-bold font-mono text-foreground">{card.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Activity */}
            <div className="bg-card border border-border rounded-xl shadow-sm">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-base font-bold text-foreground">Actividad reciente</h2>
              </div>
              <div className="p-5 space-y-0">
                {MOCK_ACTIVITY.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      {entry.type !== 'earn' && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                          entry.type === 'bonus' ? 'bg-primary/10 text-primary'
                          : entry.type === 'redeem' ? 'bg-destructive/10 text-destructive'
                          : entry.type === 'referral' ? 'bg-blue-500/10 text-blue-600'
                          : entry.type === 'membership' ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-muted text-muted-foreground'
                        }`}>
                          {entry.type === 'bonus' ? '🎁 Bonus' : entry.type === 'redeem' ? '🎟️ Canje' : entry.type === 'referral' ? '👥 Referido' : entry.type === 'membership' ? '⭐ Membresía' : entry.type}
                        </span>
                      )}
                      <div>
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">{entry.name}</span> — {entry.note}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">{entry.time}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-mono font-bold ${entry.points >= 0 ? 'text-primary' : 'text-destructive'}`}>
                      {entry.points >= 0 ? '+' : ''}{entry.points}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DemoAdmin;
