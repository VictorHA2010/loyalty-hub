import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

const AuthPage = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Sesión iniciada');
        navigate('/select-business');
      } else if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        toast.success('Cuenta creada. Revisa tu email para confirmar.');
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent opacity-90" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-primary-foreground">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
              <Shield size={24} className="text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">LoyaltyHub</span>
          </div>
          <h2 className="text-4xl font-extrabold leading-tight mb-4">
            Gestiona tu programa<br />de lealtad
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            La plataforma completa para administrar puntos, recompensas y membresías de tus clientes.
          </p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-primary-foreground/5" />
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary-foreground/5" />
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Shield size={20} className="text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">LoyaltyHub</span>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold text-foreground">
              {mode === 'login' ? 'Bienvenido de vuelta' : mode === 'register' ? 'Crear cuenta' : 'Recuperar contraseña'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === 'login' ? 'Ingresa tus credenciales para continuar' : mode === 'register' ? 'Completa tus datos para registrarte' : 'Te enviaremos un enlace para restablecer tu contraseña'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="h-11"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                className="h-11"
              />
            </div>
            {mode !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="h-11"
                />
              </div>
            )}
            <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
              {loading ? 'Cargando...' : mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Enviar enlace'}
            </Button>
          </form>

          <div className="text-center space-y-2">
            {mode === 'login' && (
              <>
                <button type="button" onClick={() => setMode('forgot')} className="text-sm text-muted-foreground hover:text-primary transition-colors block mx-auto">
                  ¿Olvidaste tu contraseña?
                </button>
                <button type="button" onClick={() => setMode('register')} className="text-sm text-primary font-medium hover:underline block mx-auto">
                  ¿No tienes cuenta? Regístrate
                </button>
              </>
            )}
            {mode === 'register' && (
              <button type="button" onClick={() => setMode('login')} className="text-sm text-primary font-medium hover:underline">
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            )}
            {mode === 'forgot' && (
              <button type="button" onClick={() => setMode('login')} className="text-sm text-primary font-medium hover:underline">
                Volver a iniciar sesión
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
