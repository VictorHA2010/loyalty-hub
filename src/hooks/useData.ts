import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserBusinesses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-businesses', user?.id],
    queryFn: async () => {
      // Fetch roles (business_admin, staff, platform_admin)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('business_id, role, businesses(id, name, slug, logo_url)')
        .eq('user_id', user!.id);
      if (rolesError) throw rolesError;

      // Fetch customer relationships
      const { data: customerData, error: customerError } = await supabase
        .from('customer_businesses')
        .select('business_id, businesses(id, name, slug, logo_url)')
        .eq('user_id', user!.id);
      if (customerError) throw customerError;

      // Combine: roles first, then customer entries not already covered
      const seen = new Set<string>();
      const combined: Array<{ business_id: string | null; role: string; businesses: any }> = [];

      for (const r of rolesData || []) {
        if (r.business_id) seen.add(r.business_id);
        combined.push(r);
      }

      for (const c of customerData || []) {
        if (!seen.has(c.business_id)) {
          seen.add(c.business_id);
          combined.push({
            business_id: c.business_id,
            role: 'customer',
            businesses: c.businesses,
          });
        }
      }

      // Filter out platform_admin entries with null business_id
      return combined.filter(r => r.business_id !== null);
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
        .from('business_members')
        .select('*, profiles!business_members_user_id_profiles_fkey(full_name, email, avatar_url, phone)')
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

// Admin dashboard metrics
export function useAdminDashboardMetrics(businessId: string | undefined) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const customers = useQuery({
    queryKey: ['admin-customers-count', businessId],
    queryFn: async () => {
      const [customersRes, rolesRes] = await Promise.all([
        supabase
          .from('customer_businesses')
          .select('user_id')
          .eq('business_id', businessId!),
        supabase
          .from('user_roles')
          .select('user_id')
          .eq('business_id', businessId!)
          .in('role', ['staff', 'business_admin'] as any),
      ]);
      if (customersRes.error) throw customersRes.error;
      const excludeIds = new Set((rolesRes.data || []).map((r) => r.user_id));
      return (customersRes.data || []).filter((c) => !excludeIds.has(c.user_id)).length;
    },
    enabled: !!businessId,
  });

  const movementsToday = useQuery({
    queryKey: ['admin-movements-today', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_ledger')
        .select('points')
        .eq('business_id', businessId!)
        .gte('created_at', todayISO);
      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId,
  });

  const redemptionsToday = useQuery({
    queryKey: ['admin-redemptions-today', businessId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId!)
        .gte('created_at', todayISO);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!businessId,
  });

  const movements = movementsToday.data || [];
  const pointsEarnedToday = movements
    .filter((m) => m.points > 0)
    .reduce((sum, m) => sum + m.points, 0);

  return {
    customersCount: customers.data ?? 0,
    movementsTodayCount: movements.length,
    pointsEarnedToday,
    redemptionsTodayCount: redemptionsToday.data ?? 0,
    isLoading: customers.isLoading || movementsToday.isLoading || redemptionsToday.isLoading,
  };
}

// Business customers list
export function useBusinessCustomers(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-customers', businessId],
    queryFn: async () => {
      const [customersRes, rolesRes] = await Promise.all([
        supabase
          .from('customer_businesses')
          .select('*, profiles!customer_businesses_user_id_fkey(id, full_name, email, phone, avatar_url)')
          .eq('business_id', businessId!)
          .order('joined_at', { ascending: false }),
        supabase
          .from('user_roles')
          .select('user_id, role')
          .eq('business_id', businessId!)
          .in('role', ['staff', 'business_admin'] as any),
      ]);
      if (customersRes.error) throw customersRes.error;
      // Exclude users who have staff or admin roles in this business
      const excludeIds = new Set((rolesRes.data || []).map((r) => r.user_id));
      return (customersRes.data || []).filter((c) => !excludeIds.has(c.user_id));
    },
    enabled: !!businessId,
  });
}

// Business memberships
export function useBusinessMemberships(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-memberships', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memberships')
        .select('*, profiles(full_name, email)')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });
}

// Loyalty settings
export function useLoyaltySettings(businessId: string | undefined) {
  return useQuery({
    queryKey: ['loyalty-settings', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_settings')
        .select('*')
        .eq('business_id', businessId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });
}

// Customer membership
export function useCustomerMembership(businessId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['customer-membership', businessId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('business_id', businessId!)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!businessId,
  });
}

// Customer points for staff
export function useCustomerPointsBalance(businessId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['customer-points', businessId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_ledger')
        .select('points')
        .eq('business_id', businessId!)
        .eq('user_id', userId!);
      if (error) throw error;
      return (data || []).reduce((sum, row) => sum + row.points, 0);
    },
    enabled: !!businessId && !!userId,
  });
}

// Business coupons (active)
export function useBusinessCoupons(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-coupons', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('business_id', businessId!)
        .eq('active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });
}

// Bonus points balance for current user in a business
export function useBonusPointsBalance(businessId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bonus-points-balance', businessId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_ledger')
        .select('points')
        .eq('business_id', businessId!)
        .eq('user_id', user!.id)
        .eq('type', 'bonus');
      if (error) throw error;
      return (data || []).reduce((sum, row) => sum + row.points, 0);
    },
    enabled: !!user && !!businessId,
  });
}

// Admin: bonus points metrics for dashboard
export function useBonusPointsMetrics(businessId: string | undefined) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const bonusToday = useQuery({
    queryKey: ['admin-bonus-today', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_ledger')
        .select('points')
        .eq('business_id', businessId!)
        .eq('type', 'bonus')
        .gte('created_at', todayISO);
      if (error) throw error;
      return (data || []).reduce((sum, r) => sum + r.points, 0);
    },
    enabled: !!businessId,
  });

  const bonusTotal = useQuery({
    queryKey: ['admin-bonus-total', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('points_ledger')
        .select('points')
        .eq('business_id', businessId!)
        .eq('type', 'bonus');
      if (error) throw error;
      return (data || []).reduce((sum, r) => sum + r.points, 0);
    },
    enabled: !!businessId,
  });

  return {
    bonusToday: bonusToday.data ?? 0,
    bonusTotal: bonusTotal.data ?? 0,
    isLoading: bonusToday.isLoading || bonusTotal.isLoading,
  };
}

// Membership plans (catalog)
export function useMembershipPlans(businessId: string | undefined) {
  return useQuery({
    queryKey: ['membership-plans', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membership_plans')
        .select('*')
        .eq('business_id', businessId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!businessId,
  });
}

// Customer referrals
export function useCustomerReferrals(businessId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['customer-referrals', businessId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('business_id', businessId!)
        .eq('referrer_user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!businessId,
  });
}
