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
  Link as LinkIcon,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

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

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-sidebar">
        <div className="p-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground truncate">{businessName}</p>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">{role}</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === basePath}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {role === 'admin' && (
          <div className="p-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">URL pública del negocio</p>
            <div className="flex items-center gap-1">
              <code className="text-xs font-mono text-foreground truncate flex-1">/b/{slug}</code>
              <button onClick={copyPublicUrl} className="p-1 text-muted-foreground hover:text-foreground rounded" title="Copiar URL">
                <Copy size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="p-2 border-t border-border space-y-0.5">
          <button
            onClick={handleSwitchBusiness}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary w-full transition-colors"
          >
            <ArrowLeft size={18} />
            Cambiar negocio
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary w-full transition-colors"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="lg:hidden flex items-center justify-between border-b border-border px-4 py-3 bg-background">
          <p className="text-sm font-semibold text-foreground">{businessName}</p>
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === basePath}
                className={({ isActive }) =>
                  `p-2 rounded-md transition-colors ${
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                  }`
                }
              >
                {item.icon}
              </NavLink>
            ))}
            <button onClick={handleSignOut} className="p-2 text-muted-foreground hover:bg-secondary rounded-md">
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
