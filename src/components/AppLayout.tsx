import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Gift,
  History,
  Users,
  Settings,
  QrCode,
  LogOut,
} from 'lucide-react';

interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
}

const adminNav: NavItem[] = [
  { label: 'Actividad', to: '/admin', icon: <LayoutDashboard size={18} /> },
  { label: 'Recompensas', to: '/admin/rewards', icon: <Gift size={18} /> },
  { label: 'Miembros', to: '/admin/members', icon: <Users size={18} /> },
  { label: 'Canjes', to: '/admin/redemptions', icon: <History size={18} /> },
  { label: 'Configuración', to: '/admin/settings', icon: <Settings size={18} /> },
];

const staffNav: NavItem[] = [
  { label: 'Escanear', to: '/staff', icon: <QrCode size={18} /> },
  { label: 'Canjes', to: '/staff/redemptions', icon: <History size={18} /> },
];

interface AppLayoutProps {
  children: ReactNode;
  role: 'admin' | 'staff';
}

const AppLayout = ({ children, role }: AppLayoutProps) => {
  const { businessContext, signOut } = useAuth();
  const navigate = useNavigate();
  const navItems = role === 'admin' ? adminNav : staffNav;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden lg:flex w-60 flex-col border-r border-border bg-sidebar">
        <div className="p-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground truncate">
            {businessContext?.businessName || 'Negocio'}
          </p>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">{role}</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/staff'}
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
        <div className="p-2 border-t border-border">
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
          <p className="text-sm font-semibold text-foreground">{businessContext?.businessName || 'Negocio'}</p>
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin' || item.to === '/staff'}
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
