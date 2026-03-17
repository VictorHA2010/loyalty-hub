import { useState } from 'react';
import { X, Gift, History, QrCode, Star, Ticket, Users, CreditCard, User, Crown, ChevronRight, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DemoTab = 'home' | 'qr' | 'rewards' | 'history' | 'membership';

const MOCK_REWARDS = [
  { id: '1', name: 'Café americano gratis', points_cost: 100, description: 'Un café americano de cualquier tamaño' },
  { id: '2', name: '2x1 en pasteles', points_cost: 200, description: 'Compra un pastel y llévate otro' },
  { id: '3', name: 'Bebida premium gratis', points_cost: 350, description: 'Cualquier bebida de especialidad' },
  { id: '4', name: 'Desayuno completo', points_cost: 500, description: 'Desayuno para una persona' },
];

const MOCK_HISTORY = [
  { id: '1', type: 'earn', points: 10, note: 'Compra — Café latte', date: 'Hoy, 10:30 AM' },
  { id: '2', type: 'bonus', points: 50, note: 'Bonus de bienvenida', date: 'Ayer, 3:00 PM' },
  { id: '3', type: 'earn', points: 15, note: 'Compra — Pastel + bebida', date: 'Hace 2 días' },
  { id: '4', type: 'redeem', points: -100, note: 'Canje: Café americano gratis', date: 'Hace 3 días' },
  { id: '5', type: 'earn', points: 10, note: 'Compra — Cappuccino', date: 'Hace 5 días' },
];

interface DemoCustomerProps {
  onClose: () => void;
}

const DemoCustomer = ({ onClose }: DemoCustomerProps) => {
  const [tab, setTab] = useState<DemoTab>('home');
  const mockBalance = 185;
  const brandPrimary = '#1F7A63';
  const brandSecondary = '#2FA886';
  const brandAccent = '#66C2A5';

  const tabs: { key: DemoTab; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: 'Inicio', icon: <Star size={18} /> },
    { key: 'qr', label: 'Mi QR', icon: <QrCode size={18} /> },
    { key: 'rewards', label: 'Premios', icon: <Gift size={18} /> },
    { key: 'history', label: 'Historial', icon: <History size={18} /> },
    { key: 'membership', label: 'Membresía', icon: <CreditCard size={18} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Close bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-card shrink-0">
        <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">DEMO — Vista Cliente</span>
        <Button variant="outline" size="sm" onClick={onClose} className="gap-2">
          <X size={14} />
          Cerrar demo
        </Button>
      </div>

      {/* App content */}
      <div className="flex-1 overflow-auto max-w-lg mx-auto w-full">
        {/* Header */}
        <header className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${brandPrimary}, ${brandSecondary})` }}>
          <div className="relative px-4 pt-5 pb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/10">
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-white/70">Mi Cafetería Demo</p>
                <p className="text-sm font-bold text-white">Hola, Juan Demo</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-white/60 uppercase tracking-wider">Tus puntos</p>
                  <p className="text-4xl font-extrabold font-mono text-white mt-0.5">{mockBalance}</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 border border-white/10">
                  <Crown size={13} className="text-white" />
                  <span className="text-[11px] font-semibold text-white">Plus · 2x</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-white/50">Próxima recompensa</p>
                  <p className="text-[10px] text-white/70 font-mono">{mockBalance}/200 pts</p>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(mockBalance / 200) * 100}%`, backgroundColor: brandAccent }} />
                </div>
                <p className="text-[10px] text-white/40 mt-1">2x1 en pasteles</p>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <nav className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex flex-col items-center gap-1 px-4 py-2.5 text-[11px] font-medium transition-colors border-b-2 whitespace-nowrap ${
                    tab === t.key ? 'text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  style={tab === t.key ? { borderBottomColor: brandPrimary, color: brandPrimary } : undefined}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="px-4 py-6 space-y-5">
          {tab === 'home' && (
            <>
              <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${brandPrimary}15` }}>
                    <Gift size={18} style={{ color: brandPrimary }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Puntos de regalo</p>
                    <p className="text-2xl font-bold font-mono text-foreground">50</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Puntos extra por promociones, membresía o bonos especiales.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <QrCode size={20} />, label: 'Mi QR', key: 'qr' as DemoTab },
                  { icon: <Gift size={20} />, label: 'Premios', key: 'rewards' as DemoTab },
                  { icon: <Ticket size={20} />, label: 'Promociones', key: 'home' as DemoTab },
                  { icon: <Users size={20} />, label: 'Invitar amigos', key: 'home' as DemoTab },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => setTab(action.key)}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all text-left shadow-sm group"
                  >
                    <div style={{ color: brandPrimary }}>{action.icon}</div>
                    <span className="text-sm font-semibold text-foreground">{action.label}</span>
                    <ChevronRight size={14} className="ml-auto text-muted-foreground" />
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === 'qr' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">Muestra este código al staff para acumular puntos</p>
              <div className="w-56 h-56 mx-auto rounded-2xl border-2 border-border bg-white flex items-center justify-center">
                <div className="text-center">
                  <QrCode size={120} className="text-foreground mx-auto" />
                  <p className="text-[10px] font-mono text-muted-foreground mt-2">DEMO-QR-TOKEN</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Juan Demo</p>
            </div>
          )}

          {tab === 'rewards' && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">Recompensas disponibles</h2>
              {MOCK_REWARDS.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono" style={{ color: brandPrimary }}>{r.points_cost} pts</p>
                      <Button
                        size="sm"
                        variant={mockBalance >= r.points_cost ? 'default' : 'outline'}
                        disabled={mockBalance < r.points_cost}
                        className="mt-1 text-xs h-7"
                        onClick={() => {}}
                      >
                        {mockBalance >= r.points_cost ? 'Canjear' : 'Insuficientes'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-foreground">Historial de movimientos</h2>
              {MOCK_HISTORY.map((h) => (
                <div key={h.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm text-foreground">{h.note}</p>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{h.date}</p>
                  </div>
                  <p className={`text-sm font-mono font-bold ${h.points >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {h.points >= 0 ? '+' : ''}{h.points}
                  </p>
                </div>
              ))}
            </div>
          )}

          {tab === 'membership' && (
            <div className="space-y-4">
              <div className="rounded-2xl p-6 text-center text-white" style={{ background: `linear-gradient(135deg, ${brandPrimary}, ${brandSecondary})` }}>
                <Crown size={32} className="mx-auto mb-2" />
                <h3 className="text-lg font-bold">Membresía Plus</h3>
                <p className="text-sm text-white/80 mt-1">Multiplicador 2x activo</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Beneficios activos</h4>
                {['Puntos x2 en cada compra', '100 puntos de bonus mensual', 'Acceso a recompensas exclusivas', 'Soporte prioritario'].map((b, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={14} style={{ color: brandPrimary }} />
                    {b}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DemoCustomer;
