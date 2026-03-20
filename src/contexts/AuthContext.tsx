// src/contexts/AuthContext.tsx

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
      // 1. ¿Es platform_admin? → tabla user_roles (esta sí existe para admins de plataforma)
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'platform_admin')
        .maybeSingle();

      if (roleData) {
        setGlobalRole('platform_admin');
        return;
      }

      // 2. ¿Es business_admin activo en algún negocio? → tabla business_members
      const { data: adminData } = await supabase
        .from('business_members')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'business_admin')
        .eq('status', 'active')
        .maybeSingle();

      if (adminData) {
        setGlobalRole('business_admin');
        return;
      }

      // 3. ¿Es staff activo en algún negocio?
      const { data: staffData } = await supabase
        .from('business_members')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'staff')
        .eq('status', 'active')
        .maybeSingle();

      if (staffData) {
        setGlobalRole('staff');
        return;
      }

      // 4. Es cliente (o usuario sin negocio que quiere contratar)
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
