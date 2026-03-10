import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  active: boolean;
}

interface BusinessContextType {
  business: Business | null;
  loading: boolean;
  error: string | null;
}

const BusinessCtx = createContext<BusinessContextType>({
  business: null,
  loading: true,
  error: null,
});

export const useBusiness = () => useContext(BusinessCtx);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setError('No se especificó un negocio');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from('businesses')
      .select('id, name, slug, logo_url, active')
      .eq('slug', slug)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err || !data) {
          setError('Negocio no encontrado');
          setBusiness(null);
        } else {
          setBusiness(data);
        }
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [slug]);

  return (
    <BusinessCtx.Provider value={{ business, loading, error }}>
      {children}
    </BusinessCtx.Provider>
  );
};
