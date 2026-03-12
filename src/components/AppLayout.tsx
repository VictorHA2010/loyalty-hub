import { ReactNode } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import {
  LayoutDashboard,
  Gift,
  History,
  Users,
  Settings,
  QrCode,
  LogOut,
  ArrowLeft,
  Crown,
  Sliders,
  UserCheck,
  Copy,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

function getAdminNav(slug: string): NavItem[] {
  return [
    { label: 'Dashboard', to: `/admin/${slug}`, icon: <LayoutDashboard size={18} /> },
    { label: 'Recompensas', to: `/admin/${slug}/rewards`, icon: <Gift size={18} /> },
    { label: 'Staff', to: `/admin/${slug}/staff`, icon: <UserCheck size={18} /> },
    { label: 'Miembros', to: `/admin/${slug}/members`, icon: <Users size={18} /> },
    { label: 'Clientes', to: `/admin/${slug}/customers`, icon: <Users size={18} /> },
    { label: 'Membresías', to: `/admin/${slug}/memberships`, icon: <Crown size={18} /> },
    { label: 'Canjes', to: `/admin/${slug}/redemptions`, icon: <History size={18} /> },
    { label: 'Reglas de puntos', to: `/admin/${slug}/loyalty`, icon: <Sliders size={18} /> },
    { label: 'Configuración', to: `/admin/${slug}/settings`, icon: <Settings size={18} /> },
  ];
}

function getStaffNav(slug: string): NavItem[] {
  return [
    { label: 'Operaciones', to: `/staff/${slug}`, icon: <QrCode size={18} /> },
  ];
}

interface AppLayoutProps {
  children: ReactNode;
  role: 'admin' | 'staff';
}

const AppLayout = ({ children, role }: AppLayoutProps) => {
  const { signOut, globalRole } = useAuth();
  const { business } = useBusiness();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const navItems = role === 'admin' ? getAdminNav(slug || '') : getStaffNav(slug || '');
  const businessName = business?.name || 'Negocio';
  const publicUrl = `${window.location.origin}/b/${slug}`;
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSwitchBusiness = () => {
    navigate('/select-business');
  };

  const copyPublicUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('URL copiada');
  };

  const basePath = role === 'admin' ? `/admin/${slug}` : `/staff/${slug}`;

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
            <Shield size={16} className="text-sidebar-primary" />
          </div>
          <span className="text-sm font-bold text-sidebar-foreground tracking-tight">LoyaltyHub</span>
        </div>
        <div className="bg-sidebar-accent rounded-lg px-3 py-2">
          <p className="text-xs font-semibold text-sidebar-foreground truncate">{businessName}</p>
          <p className="text-[10px] font-mono text-sidebar-muted mt-0.5 uppercase tracking-wider">{role === 'admin' ? 'Administrador' : 'Staff'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider px-3 mb-2">Menú</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === basePath}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* URL section */}
      {role === 'admin' && (
        <div className="px-4 py-3 border-t border-sidebar-border">
          <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider mb-1.5">URL pública</p>
          <div className="flex items-center gap-1.5">
            <code className="text-xs font-mono text-sidebar-foreground/60 truncate flex-1">/b/{slug}</code>
            <button onClick={copyPublicUrl} className="p-1.5 text-sidebar-muted hover:text-sidebar-foreground rounded-md hover:bg-sidebar-accent transition-colors" title="Copiar URL">
              <Copy size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-0.5">
        {globalRole === 'platform_admin' ? (
          <button
            onClick={() => { navigate('/platform'); setMobileOpen(false); }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors"
          >
            <ArrowLeft size={18} />
            Plataforma
          </button>
        ) : (
          <button
            onClick={() => { handleSwitchBusiness(); setMobileOpen(false); }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors"
          >
            <ArrowLeft size={18} />
            Cambiar negocio
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar fixed inset-y-0 left-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col bg-sidebar shadow-elevated animate-slide-up">
            <div className="absolute top-3 right-3">
              <button onClick={() => setMobileOpen(false)} className="p-1.5 text-sidebar-muted hover:text-sidebar-foreground rounded-md">
                <X size={18} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="lg:hidden flex items-center justify-between border-b border-border px-4 py-3 bg-card shadow-card sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-primary" />
            <span className="text-sm font-bold text-foreground">LoyaltyHub</span>
          </div>
          <button onClick={handleSignOut} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
            <LogOut size={18} />
          </button>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
