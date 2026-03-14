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
  is_active: boolean | null;
  subscription_status: string | null;
  current_period_end: string | null;
}

interface BusinessContextType {
  business: Business | null;
  loading: boolean;
  error: string | null;
  refetchBusiness: () => void;
}

const BusinessCtx = createContext<BusinessContextType>({
  business: null,
  loading: true,
  error: null,
  refetchBusiness: () => {},
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

  // Dynamic PWA manifest based on business
  useEffect(() => {
    const defaultManifest = '/manifest.json';

    if (!business) {
      // Reset to default manifest
      const existing = document.querySelector("link[rel='manifest']");
      if (existing) existing.setAttribute('href', defaultManifest);
      return;
    }

    const iconSrc = business.logo_url || '/icons/icon-512x512.png';

    const manifest = {
      name: business.name,
      short_name: business.name.length > 12 ? business.name.substring(0, 12) : business.name,
      description: business.short_description || `Programa de lealtad de ${business.name}`,
      start_url: `/b/${business.slug}`,
      scope: `/b/${business.slug}`,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: business.primary_color || '#6366f1',
      icons: [
        { src: iconSrc, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: iconSrc, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
    };

    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    let link = document.querySelector("link[rel='manifest']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    link.href = url;

    // Also update apple-touch-icon for iOS
    let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null;
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    appleIcon.href = iconSrc;

    // Update theme-color meta
    let themeMeta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement | null;
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = business.primary_color || '#6366f1';

    return () => {
      URL.revokeObjectURL(url);
      if (link) link.href = defaultManifest;
      if (appleIcon) appleIcon.href = '/icons/icon-192x192.png';
    };
  }, [business]);

  return (
    <BusinessCtx.Provider value={{ business, loading, error }}>
      {children}
    </BusinessCtx.Provider>
  );
};
