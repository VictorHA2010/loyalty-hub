// src/pages/BusinessAuthPage.tsx

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/contexts/BusinessContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Building2, Shield } from 'lucide-react';

const BusinessAuthPage = () => {
  const { business, loading: bizLoading, error: bizError } = useBusiness();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && business) {
      autoLinkAndRedirect();
    }
  }, [user, business]);

  const autoLinkAndRedirect = async () => {
    if (!user || !business) return;
    try {
      // Vincular como cliente si no existe el vínculo
      // customer_businesses solo tiene: user_id, business_id, joined_at
      const { data: existing } = await supabase
        .from('customer_businesses')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', business.id)
        .maybeSingle();

      if (!existing) {
        const { error: insertError } = await supabase
          .from('customer_businesses')
          .insert({
            user_id: user.id,
            business_id: business.id,
            // joined_at tiene default en BD, no es necesario enviarlo
          });

        if (insertError) {
          console.error('[BusinessAuthPage] Error al vincular cliente:', insertError);
        }
      }

      // Verificar si tiene un rol especial en business_members
      const { data: memberRow } = await supabase
        .from('business_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('business_id', business.id)
        .eq('status', 'active')
        .maybeSingle();

      if (memberRow?.role === 'business_admin') {
        navigate(`/admin/${business.slug}`, { replace: true });
        return;
      }

      if (memberRow?.role === 'staff') {
        navigate(`/staff/${business.slug}`, { replace: true });
        return;
      }

      // Cliente normal → app del negocio
      navigate(`/b/${business.slug}/app`, { replace: true });

    } catch (err) {
      console.error('[BusinessAuthPage] Error en autoLinkAndRedirect:', err);
      navigate(`/b/${business.slug}/app`, { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Sesión iniciada');
        // autoLinkAndRedirect se dispara via useEffect

      } else if (mode === 'register') {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/b/${business?.slug}/app`,
          },
        });

        // Correo ya registrado → login automático
        if (
          signUpError?.status === 400 ||
          signUpError?.message?.toLowerCase().includes('already registered')
        ) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            throw new Error('Este correo ya está registrado. Verifica tu contraseña.');
          }
          toast.success('Accediendo a tu cuenta existente...');
          // autoLinkAndRedirect se ejecutará via useEffect
          return;
        }

        if (signUpError) throw signUpError;

        if (signUpData.user && signUpData.session) {
          toast.success('Cuenta creada');
          // autoLinkAndRedirect se ejecutará via useEffect
        } else {
          toast.success('Cuenta creada. Revisa tu email para confirmar.');
        }

      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success('Revisa tu email para restablecer tu contraseña.');
        setMode('login');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (bizLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (bizError || !business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Building2 size={48} className="mx-auto text-muted-foreground/30" />
          <h1 className="text-xl font-bold text-foreground">Negocio no encontrado</h1>
        </div>
      </div>
    );
  }

  const brandColor = business.primary_color || undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8 px-4">
        <div className="text-center">
          {business.logo_url ? (
            <img src={business.logo_url} alt={business.name}
              className="w-16 h-16 rounded-2xl mx-auto object-cover mb-4 shadow-card" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center mb-4 shadow-card">
              <Shield size={24} className="text-primary" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-foreground">
            {mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Recuperar contraseña'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{business.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre" required className="h-11" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com" required className="h-11" />
          </div>
          {mode !== 'forgot' && (
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6} className="h-11" />
            </div>
          )}
          <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}
            style={brandColor ? { backgroundColor: brandColor } : {}}>
            {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Enviar enlace'}
          </Button>
        </form>

        <div className="text-center space-y-2">
          {mode === 'login' && (
            <>
              <button type="button" onClick={() => setMode('forgot')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors block mx-auto">
                ¿Olvidaste tu contraseña?
              </button>
              <button type="button" onClick={() => setMode('register')}
                className="text-sm text-primary font-semibold hover:underline block mx-auto">
                ¿No tienes cuenta? Regístrate
              </button>
            </>
          )}
          {mode === 'register' && (
            <button type="button" onClick={() => setMode('login')}
              className="text-sm text-primary font-semibold hover:underline">
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          )}
          {mode === 'forgot' && (
            <button type="button" onClick={() => setMode('login')}
              className="text-sm text-primary font-semibold hover:underline">
              Volver a iniciar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessAuthPage;
