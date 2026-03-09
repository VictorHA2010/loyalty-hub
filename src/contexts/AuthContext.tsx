import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'platform_admin' | 'business_admin' | 'staff' | 'customer' | null;

interface BusinessContext {
  businessId: string;
  role: UserRole;
  businessName: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  globalRole: UserRole;
  businessContext: BusinessContext | null;
  setBusinessContext: (ctx: BusinessContext | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  globalRole: null,
  businessContext: null,
  setBusinessContext: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [globalRole, setGlobalRole] = useState<UserRole>(null);
  const [businessContext, setBusinessContext] = useState<BusinessContext | null>(null);

  const resolveGlobalRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role, business_id')
        .eq('user_id', userId);

      if (!data || data.length === 0) {
        setGlobalRole('customer');
        return;
      }

      // Check for platform_admin first (business_id can be null)
      const isPlatformAdmin = data.some(r => r.role === 'platform_admin');
      if (isPlatformAdmin) {
        setGlobalRole('platform_admin');
        return;
      }

      // Check for business_admin
      const isBusinessAdmin = data.some(r => r.role === 'business_admin');
      if (isBusinessAdmin) {
        setGlobalRole('business_admin');
        return;
      }

      // Check for staff
      const isStaff = data.some(r => r.role === 'staff');
      if (isStaff) {
        setGlobalRole('staff');
        return;
      }

      setGlobalRole('customer');
    } catch {
      setGlobalRole('customer');
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Defer to avoid deadlock with Supabase client
        setTimeout(() => resolveGlobalRole(session.user.id), 0);
      } else {
        setGlobalRole(null);
        setBusinessContext(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        resolveGlobalRole(session.user.id).then(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setBusinessContext(null);
    setGlobalRole(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, globalRole, businessContext, setBusinessContext, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
