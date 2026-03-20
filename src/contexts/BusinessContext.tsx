import React, { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// ... (Interface Business se mantiene igual)

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadBusinessData = async () => {
      // 1. SI HAY SLUG EN LA URL (Vista de Cliente o Admin específico)
      if (slug) {
        await fetchBySlug(slug, cancelled);
      } 
      // 2. SI NO HAY SLUG (Estamos en Dashboard o Planes), BUSCAMOS POR DUEÑO
      else {
        await fetchByOwner(cancelled);
      }
    };

    loadBusinessData();
    return () => { cancelled = true; };
  }, [slug]);

  const fetchBySlug = async (businessSlug: string, cancelled: boolean) => {
    const { data, error: err } = await supabase
      .from('businesses')
      .select('*') // Seleccionamos todo para asegurar que traemos los campos de suscripción
      .eq('slug', businessSlug)
      .maybeSingle();

    if (cancelled) return;

    if (err || !data) {
      setError('Negocio no encontrado');
      setBusiness(null);
    } else {
      setBusiness(data);
    }
    setLoading(false);
  };

  const fetchByOwner = async (cancelled: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error: err } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', session.user.id)
      .maybeSingle();

    if (cancelled) return;

    if (data) {
      setBusiness(data);
    } else {
      setBusiness(null); // No tiene negocio aún, está bien (irá a contratar)
    }
    setLoading(false);
  };

  const refetchBusiness = () => {
    setLoading(true);
    if (slug) {
      fetchBySlug(slug, false);
    } else {
      fetchByOwner(false);
    }
  };

  // ... (Efectos de Favicon y Manifest se mantienen igual, funcionan bien con el nuevo estado)

  return (
    <BusinessCtx.Provider value={{ business, loading, error, refetchBusiness }}>
      {children}
    </BusinessCtx.Provider>
  );
};