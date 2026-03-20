// src/contexts/BusinessContext.tsx

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// ─── Interfaz completa ────────────────────────────────────────────────────────
// FIX: Antes estaba comentada con "// ..." → TypeScript no podía inferir
//      campos como `slug`, causando errores en RoleSwitcher y AppLayout.

export interface Business {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  description?: string | null;
  // Suscripción
  subscription_status?: string | null;
  subscription_plan?: string | null;
  subscription_end_date?: string | null;
  trial_ends_at?: string | null;
  // Configuración de puntos
  points_per_peso?: number | null;
  min_purchase_for_points?: number | null;
  // Metadatos
  created_at?: string | null;
  updated_at?: string | null;
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

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── FIX CRÍTICO: funciones al scope del componente con useCallback ──────────
  // Antes estaban dentro del useEffect → refetchBusiness() lanzaba ReferenceError.

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

  const fetchByOwner = useCallback(async () => {
    setLoading(true);
    setError(null);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error: err } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', session.user.id)
      .maybeSingle();

    if (err) {
      console.error('[BusinessContext] Error fetchByOwner:', err);
    }

    // data puede ser null si el usuario aún no tiene negocio (irá a contratar)
    setBusiness(data ? (data as Business) : null);
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
        await fetchByOwner();
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, fetchBySlug, fetchByOwner]);

  // ── refetchBusiness — ahora SÍ puede llamar a las funciones del scope ──────

  const refetchBusiness = useCallback(() => {
    if (slug) {
      fetchBySlug(slug);
    } else {
      fetchByOwner();
    }
  }, [slug, fetchBySlug, fetchByOwner]);

  // ── Efectos de Favicon y Manifest (se mantienen) ───────────────────────────

  useEffect(() => {
    if (!business) return;

    // Favicon dinámico
    if (business.logo_url) {
      const link =
        (document.querySelector("link[rel='icon']") as HTMLLinkElement) ||
        document.createElement('link');
      link.rel = 'icon';
      link.href = business.logo_url;
      document.head.appendChild(link);
    }

    // Color primario en meta theme-color
    if (business.primary_color) {
      let meta = document.querySelector(
        "meta[name='theme-color']"
      ) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.appendChild(meta);
      }
      meta.content = business.primary_color;
    }
  }, [business]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <BusinessCtx.Provider value={{ business, loading, error, refetchBusiness }}>
      {children}
    </BusinessCtx.Provider>
  );
};
