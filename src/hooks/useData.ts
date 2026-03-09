import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useOrganizations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['organizations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_users')
        .select('organization_id, role, organizations(id, name, slug, active)')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function usePointsBalance(organizationId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['points-balance', organizationId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_ledger')
        .select('points')
        .eq('organization_id', organizationId!)
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data || []).reduce((sum, row) => sum + row.points, 0);
    },
    enabled: !!user && !!organizationId,
  });
}

export function useRewards(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['rewards', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('organization_id', organizationId!)
        .eq('active', true)
        .order('points_cost', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

export function useAllRewards(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['all-rewards', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

export function usePointsHistory(organizationId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['points-history', organizationId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_ledger')
        .select('*')
        .eq('organization_id', organizationId!)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!organizationId,
  });
}

export function useRedemptions(organizationId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['redemptions', organizationId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('redemptions')
        .select('*, rewards(name, points_cost)')
        .eq('organization_id', organizationId!)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!organizationId,
  });
}

export function useOrgRedemptions(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['org-redemptions', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('redemptions')
        .select('*, rewards(name, points_cost), profiles(full_name)')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

export function useOrgMembers(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['org-members', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_users')
        .select('*, profiles(full_name, avatar_url, phone)')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

export function useOrgActivity(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['org-activity', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_ledger')
        .select('*, profiles(full_name)')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useOrgSettings(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['org-settings', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', organizationId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}
