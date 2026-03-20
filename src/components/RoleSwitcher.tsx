// src/components/RoleSwitcher.tsx
//
// Uso en AppLayout: <RoleSwitcher />  ← sin props, tal como lo tienes
// Consume useAuth() y useBusiness() internamente.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Crown,
  UserCircle,
  Users,
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type UserRole = 'owner' | 'staff' | 'customer';

interface BusinessEntry {
  id: string;
  name: string;
  slug: string;
  role: UserRole;
}

const ROLE_LABEL: Record<UserRole, string> = {
  owner: 'Dueño',
  staff: 'Staff',
  customer: 'Cliente',
};

const ROLE_COLOR: Record<UserRole, string> = {
  owner: 'bg-purple-100 text-purple-700 border-purple-200',
  staff: 'bg-blue-100 text-blue-700 border-blue-200',
  customer: 'bg-green-100 text-green-700 border-green-200',
};

function RoleIcon({ role }: { role: UserRole }) {
  if (role === 'owner') return <Crown className="h-3 w-3" />;
  if (role === 'staff') return <Users className="h-3 w-3" />;
  return <UserCircle className="h-3 w-3" />;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function RoleSwitcher() {
  const { user } = useAuth();
  const { business } = useBusiness();
  const navigate = useNavigate();

  const [entries, setEntries] = useState<BusinessEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Carga todos los negocios/roles del usuario ──
  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      setLoading(true);
      const collected: BusinessEntry[] = [];

      try {
        // 1. Negocios donde es dueño
        const { data: owned } = await supabase
          .from('businesses')
          .select('id, name, slug')
          .eq('owner_id', user.id);

        (owned ?? []).forEach((b) =>
          collected.push({ id: b.id, name: b.name, slug: b.slug, role: 'owner' })
        );

        // 2. Negocios donde es staff
        const { data: staffRows } = await supabase
          .from('staff')
          .select('business_id, businesses(id, name, slug)')
          .eq('user_id', user.id);

        (staffRows ?? []).forEach((row: any) => {
          const b = row.businesses;
          if (b) collected.push({ id: b.id, name: b.name, slug: b.slug, role: 'staff' });
        });

        // 3. Negocios donde es cliente
        const { data: customerRows } = await supabase
          .from('customer_businesses')
          .select('business_id, businesses(id, name, slug)')
          .eq('user_id', user.id);

        (customerRows ?? []).forEach((row: any) => {
          const b = row.businesses;
          if (b) collected.push({ id: b.id, name: b.name, slug: b.slug, role: 'customer' });
        });
      } catch (err) {
        console.error('[RoleSwitcher] Error cargando negocios:', err);
      }

      setEntries(collected);
      setLoading(false);
    };

    load();
  }, [user?.id]);

  // ── Contexto activo ──
  // Intenta mapear el negocio actual del BusinessContext a una entrada
  const current: BusinessEntry | null = business
    ? entries.find((e) => e.id === business.id) ??
      {
        id: business.id,
        name: business.name ?? 'Negocio',
        slug: (business as any).slug ?? '',
        role: 'owner' as UserRole,
      }
    : null;

  const hasMultiple = entries.length > 1;

  // ── Navegación al cambiar ──
  const handleSwitch = (entry: BusinessEntry) => {
    if (entry.role === 'owner') navigate(`/admin/${entry.slug}`);
    else if (entry.role === 'staff') navigate(`/staff/${entry.slug}`);
    else navigate(`/b/${entry.slug}`);
  };

  // ── Render: cargando ──
  if (loading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled
        className="w-full justify-start gap-2 text-sidebar-muted"
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="text-xs">Cargando roles...</span>
      </Button>
    );
  }

  // ── Render: sin datos ──
  if (!current) return null;

  // ── Render: un solo contexto (sin dropdown) ──
  if (!hasMultiple) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/30 border border-sidebar-border/50">
        <Avatar className="h-5 w-5 shrink-0">
          <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
            {initials(current.name)}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium text-sidebar-foreground truncate flex-1">
          {current.name}
        </span>
        <Badge
          variant="outline"
          className={`text-[9px] px-1 py-0 shrink-0 flex items-center gap-0.5 ${ROLE_COLOR[current.role]}`}
        >
          <RoleIcon role={current.role} />
          {ROLE_LABEL[current.role]}
        </Badge>
      </div>
    );
  }

  // ── Render: múltiples contextos (con dropdown) ──
  const owned   = entries.filter((e) => e.role === 'owner');
  const staff   = entries.filter((e) => e.role === 'staff');
  const clients = entries.filter((e) => e.role === 'customer');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between gap-2 bg-sidebar-accent/30 border-sidebar-border/50 hover:bg-sidebar-accent"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-5 w-5 shrink-0">
              <AvatarFallback className="text-[9px] bg-primary/20 text-primary">
                {initials(current.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium truncate">{current.name}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant="outline"
              className={`text-[9px] px-1 py-0 flex items-center gap-0.5 ${ROLE_COLOR[current.role]}`}
            >
              <RoleIcon role={current.role} />
              {ROLE_LABEL[current.role]}
            </Badge>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="start" className="w-60 mb-1">
        {/* Mis negocios (owner) */}
        {owned.length > 0 && (
          <>
            <DropdownMenuLabel className="text-[10px] text-muted-foreground flex items-center gap-1.5 py-1.5">
              <Crown className="h-3 w-3" /> Mis negocios
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {owned.map((e) => (
                <EntryItem
                  key={`${e.id}-owner`}
                  entry={e}
                  current={current}
                  onSelect={handleSwitch}
                />
              ))}
            </DropdownMenuGroup>
          </>
        )}

        {/* Staff */}
        {staff.length > 0 && (
          <>
            {owned.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-[10px] text-muted-foreground flex items-center gap-1.5 py-1.5">
              <Users className="h-3 w-3" /> Trabajo como staff en
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {staff.map((e) => (
                <EntryItem
                  key={`${e.id}-staff`}
                  entry={e}
                  current={current}
                  onSelect={handleSwitch}
                />
              ))}
            </DropdownMenuGroup>
          </>
        )}

        {/* Cliente */}
        {clients.length > 0 && (
          <>
            {(owned.length > 0 || staff.length > 0) && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-[10px] text-muted-foreground flex items-center gap-1.5 py-1.5">
              <UserCircle className="h-3 w-3" /> Soy cliente en
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {clients.map((e) => (
                <EntryItem
                  key={`${e.id}-customer`}
                  entry={e}
                  current={current}
                  onSelect={handleSwitch}
                />
              ))}
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Sub-componente: fila individual ─────────────────────────────────────────

function EntryItem({
  entry,
  current,
  onSelect,
}: {
  entry: BusinessEntry;
  current: BusinessEntry;
  onSelect: (e: BusinessEntry) => void;
}) {
  const isActive = entry.id === current.id && entry.role === current.role;

  return (
    <DropdownMenuItem
      className="flex items-center gap-2.5 cursor-pointer py-2"
      onSelect={() => !isActive && onSelect(entry)}
    >
      <Avatar className="h-6 w-6 shrink-0">
        <AvatarFallback className="text-[9px] bg-muted">
          {initials(entry.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{entry.name}</p>
        <p className="text-[10px] text-muted-foreground">{ROLE_LABEL[entry.role]}</p>
      </div>
      {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
    </DropdownMenuItem>
  );
}
