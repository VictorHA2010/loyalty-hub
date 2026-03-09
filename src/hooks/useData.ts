import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserBusinesses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-businesses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('business_id, role, businesses(id, name, slug, logo_url)')
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

export function usePointsBalance(businessId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['points-balance', businessId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_ledger')
        .select('points')
        .eq('business_id', businessId!)
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data || []).reduce((sum, row) => sum + row.points, 0);
    },
    enabled: !!user && !!businessId,
  });
}

export function useRewards(businessId: string | undefined) {
  return useQuery({
    queryKey: ['rewards', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('business_id', businessId!)
        .eq('active', true)
        .order('points_cost', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });
}

export function useAllRewards(businessId: string | undefined) {
  return useQuery({
    queryKey: ['all-rewards', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });
}

export function usePointsHistory(businessId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['points-history', businessId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_ledger')
        .select('*')
        .eq('business_id', businessId!)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!businessId,
  });
}

export function useRedemptions(businessId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['redemptions', businessId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('redemptions')
        .select('*, rewards(name, points_cost)')
        .eq('business_id', businessId!)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!businessId,
  });
}

export function useBusinessRedemptions(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-redemptions', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('redemptions')
        .select('*, rewards(name, points_cost), profiles(full_name)')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });
}

export function useBusinessMembers(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-members', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*, profiles(full_name, avatar_url, phone)')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });
}

export function useBusinessActivity(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-activity', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_ledger')
        .select('*, profiles(full_name)')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
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
