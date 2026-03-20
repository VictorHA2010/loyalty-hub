// src/contexts/BusinessContext.tsx

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// ─── Interfaz alineada 100% con la tabla `businesses` real en Supabase ────────

export interface Business {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  short_description?: string | null;
  welcome_message?: string | null;
  business_type?: string | null;
  active: boolean;
  is_active?: boolean | null;
  subscription_status?: string | null;
  stripe_customer_id?: string | null;
  stripe_price_id?: string | null;
  current_period_end?: string | null;
  custom_domain?: string | null;
  banner_active: boolean;
  banner_title?: string | null;
  banner_description?: string | null;
  banner_image?: string | null;
  banner_link?: string | null;
  created_at?: string | null;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

interface BusinessContextValue {
  business: Business | null;
  loading: boolean;
  error: string | null;
  refetchBusiness: () => void;
}

const BusinessCtx = createContext<BusinessContextValue>({
  business: null,
  loading: true,
  error: null,
  refetchBusiness: () => {},
});

export const useBusiness = () => {
  const ctx = useContext(BusinessCtx);
  if (!ctx) throw new Error('useBusiness debe usarse dentro de <BusinessProvider>');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── fetchBySlug — para rutas /b/:slug, /admin/:slug, /staff/:slug ──────────
  const fetchBySlug = useCallback(async (businessSlug: string) => {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('businesses')
      .select('*')
      .eq('slug', businessSlug)
      .maybeSingle();

    if (err || !data) {
      setError('Negocio no encontrado');
      setBusiness(null);
    } else {
      setBusiness(data as Business);
    }
    setLoading(false);
  }, []);

  // ── fetchByMember — para rutas sin slug (dashboard, planes) ───────────────
  // Ya no buscamos por owner_id (no existe en BD).
  // Buscamos en business_members donde el usuario es business_admin.
  const fetchByMember = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error: err } = await supabase
      .from('business_members')
      .select('business_id, businesses(*)')
      .eq('user_id', session.user.id)
      .eq('role', 'business_admin')
      .eq('status', 'active')
      .maybeSingle();

    if (err) {
      console.error('[BusinessContext] Error fetchByMember:', err);
    }

    if (data?.businesses) {
      setBusiness(data.businesses as unknown as Business);
    } else {
      setBusiness(null);
    }
    setLoading(false);
  }, []);

  // ── Efecto principal ────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (cancelled) return;
      if (slug) {
        await fetchBySlug(slug);
      } else {
        await fetchByMember();
      }
    };
    load();
    return () => { cancelled = true; };
  }, [slug, fetchBySlug, fetchByMember]);

  // ── refetchBusiness ────────────────────────────────────────────────────────

  const refetchBusiness = useCallback(() => {
    if (slug) fetchBySlug(slug);
    else fetchByMember();
  }, [slug, fetchBySlug, fetchByMember]);

  // ── Efectos de Favicon y Theme Color ──────────────────────────────────────

  useEffect(() => {
    if (!business) return;

    if (business.logo_url) {
      const link = (document.querySelector("link[rel='icon']") as HTMLLinkElement)
        || document.createElement('link');
      link.rel = 'icon';
      link.href = business.logo_url;
      document.head.appendChild(link);
    }

    if (business.primary_color) {
      let meta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.content = business.primary_color;
    }
  }, [business]);
  
  return (
    <BusinessCtx.Provider value={{ business, loading, error, refetchBusiness }}>
      {children}
    </BusinessCtx.Provider>
  );
};
