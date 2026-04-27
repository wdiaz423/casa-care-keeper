import { useState } from 'react';
import { api } from "@/api/client"; 
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mail, Lock, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleLogin } from '@react-oauth/google'
import { toast } from 'sonner';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success('¡Bienvenido de vuelta!');
      } else {
        await signUp(email, password, name);
        toast.success('Cuenta creada con éxito');
      }
      // Redirigir al home tras éxito
      navigate('/');
    } catch (err: any) {
      
      const message = err.data?.error || 'Error de autenticación';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
    setLoading(true);
    try {
      // Enviamos el token que nos dio Google a TU archivo de backend
      const data = await api.post('/auth/google-login', { 
        token: tokenResponse.access_token 
      });

      // Guardamos TU JWT en el localStorage
      localStorage.setItem('token', data.token);
      toast.success('¡Sesión iniciada con Google!');
      navigate('/');
    } catch (err) {
      toast.error('Error al validar con nuestro servidor');
    } finally {
      setLoading(false);
    }
  },
  onError: () => toast.error('Error al abrir el login de Google'),
});

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm space-y-6"
      >
        <div className="text-center">
          <motion.div 
            className="mx-auto h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-5 shadow-lg shadow-primary/20"
            whileHover={{ rotate: 5, scale: 1.05 }}
          >
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <h1 className="text-3xl font-heading text-foreground tracking-tight">Mi Hogar</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isLogin ? 'Inicia sesión para continuar' : 'Crea tu cuenta'}
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full gap-2 h-11 rounded-xl border-border/50 hover:bg-accent/50 transition-all"
          onClick={() => handleGoogleLogin()}
          disabled={loading}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground tracking-wider">O con email</span>
          </div>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="name">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" className="pl-9 h-11 rounded-xl" required />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className="pl-9 h-11 rounded-xl" required />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              {isLogin && (
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-9 h-11 rounded-xl" required minLength={6} />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 rounded-xl shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? 'Cargando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)} 
            className="text-primary font-semibold hover:underline"
          >
            {isLogin ? 'Regístrate' : 'Inicia sesión'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default AuthPage;