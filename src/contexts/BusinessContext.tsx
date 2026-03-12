import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  active: boolean;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  banner_image: string | null;
  banner_title: string | null;
  banner_description: string | null;
  banner_link: string | null;
  banner_active: boolean;
  welcome_message: string | null;
  short_description: string | null;
  business_type: string | null;
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
      .select('id, name, slug, logo_url, active, primary_color, secondary_color, accent_color, banner_image, banner_title, banner_description, banner_link, banner_active, welcome_message, short_description, business_type')
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

  // Dynamic favicon based on business logo
  useEffect(() => {
    const link: HTMLLinkElement =
      document.querySelector("link[rel~='icon']") ||
      (() => {
        const el = document.createElement('link');
        el.rel = 'icon';
        document.head.appendChild(el);
        return el;
      })();

    if (business?.logo_url) {
      link.href = business.logo_url;
      link.type = 'image/png';
    } else {
      link.href = '/favicon.ico';
      link.type = 'image/x-icon';
    }

    return () => {
      link.href = '/favicon.ico';
      link.type = 'image/x-icon';
    };
  }, [business]);

  return (
    <BusinessCtx.Provider value={{ business, loading, error }}>
      {children}
    </BusinessCtx.Provider>
  );
};
