import { ReactNode, useState } from 'react';
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
  CreditCard,
  Copy,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { RoleSwitcher } from './RoleSwitcher'; 

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
    { label: 'Clientes', to: `/admin/${slug}/customers`, icon: <Users size={18} /> },
    { label: 'Membresías', to: `/admin/${slug}/memberships`, icon: <Crown size={18} /> },
    { label: 'Canjes', to: `/admin/${slug}/redemptions`, icon: <History size={18} /> },
    { label: 'Reglas de puntos', to: `/admin/${slug}/loyalty`, icon: <Sliders size={18} /> },
    { label: 'Configuración', to: `/admin/${slug}/settings`, icon: <Settings size={18} /> },
    { label: 'Planes', to: `/admin/${slug}/plans`, icon: <CreditCard size={18} /> },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = role === 'admin' ? getAdminNav(slug || '') : getStaffNav(slug || '');
  const businessName = business?.name || 'Mi Negocio';
  const publicUrl = `${window.location.origin}/b/${slug}`;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleSwitchBusiness = () => {
    navigate('/select-business');
  };

  const copyPublicUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('URL copiada al portapapeles');
  };

  const basePath = role === 'admin' ? `/admin/${slug}` : `/staff/${slug}`;

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div className="p-5 border-b border-sidebar-border bg-gradient-to-r from-sidebar to-sidebar-accent/30">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center backdrop-blur-sm">
            <Shield size={16} className="text-primary" />
          </div>
          <span className="text-sm font-bold text-sidebar-foreground tracking-tight">LoyaltyHub</span>
        </div>
        <div className="bg-sidebar-accent/50 rounded-lg px-3 py-2 border border-sidebar-border/50">
          <p className="text-xs font-semibold text-sidebar-foreground truncate">{businessName}</p>
          <p className="text-[10px] font-mono text-primary mt-0.5 uppercase tracking-wider font-bold">
            {role === 'admin' ? 'Administrador' : 'Staff'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider px-3 mb-2 opacity-50">Menú Principal</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === basePath}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
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
      {role === 'admin' && slug && (
        <div className="px-4 py-3 border-t border-sidebar-border bg-sidebar-accent/20">
          <p className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider mb-1.5">Tu enlace de clientes</p>
          <div className="flex items-center gap-1.5 p-2 bg-background/50 rounded-md border border-sidebar-border">
            <code className="text-[10px] font-mono text-sidebar-foreground/60 truncate flex-1">/b/{slug}</code>
            <button onClick={copyPublicUrl} className="p-1 text-primary hover:bg-primary/10 rounded transition-colors">
              <Copy size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="px-3 py-3 border-t border-sidebar-border space-y-1 bg-sidebar">
        
        {/* ROLE SWITCHER - El cambio clave */}
        <div className="mb-2">
          <RoleSwitcher />
        </div>
        
        <div className="pt-1 space-y-0.5">
          {globalRole === 'platform_admin' ? (
            <button
              onClick={() => { navigate('/platform'); setMobileOpen(false); }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-muted hover:text-primary hover:bg-primary/5 w-full transition-all"
            >
              <ArrowLeft size={16} />
              Panel de Plataforma
            </button>
          ) : (
            <button
              onClick={() => { handleSwitchBusiness(); setMobileOpen(false); }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-muted hover:text-primary hover:bg-primary/5 w-full transition-all"
            >
              <ArrowLeft size={16} />
              Cambiar de negocio
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive/70 hover:text-destructive hover:bg-destructive/5 w-full transition-all"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-sidebar border-r border-sidebar-border fixed inset-y-0 left-0 z-30 shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        <header className="lg:hidden flex items-center justify-between border-b border-border px-4 py-3 bg-card sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            <span className="text-sm font-bold">LoyaltyHub</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </header>
        
        <main className="flex-1 p-4 lg:p-8 animate-in fade-in duration-500">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 flex flex-col bg-sidebar shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="absolute top-4 right-4">
              <button onClick={() => setMobileOpen(false)} className="p-2 text-sidebar-muted hover:text-primary">
                <X size={20} />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}
    </div>
  );
};

export default AppLayout;