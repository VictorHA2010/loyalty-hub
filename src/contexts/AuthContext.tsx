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
  businessContext: BusinessContext | null;
  setBusinessContext: (ctx: BusinessContext | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  businessContext: null,
  setBusinessContext: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessContext, setBusinessContext] = useState<BusinessContext | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setBusinessContext(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, businessContext, setBusinessContext, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
