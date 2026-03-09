import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type UserRole = 'admin' | 'staff' | 'customer' | null;

interface OrgContext {
  organizationId: string;
  role: UserRole;
  orgName: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  orgContext: OrgContext | null;
  setOrgContext: (ctx: OrgContext | null) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  orgContext: null,
  setOrgContext: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgContext, setOrgContext] = useState<OrgContext | null>(null);

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
    setOrgContext(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, orgContext, setOrgContext, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
