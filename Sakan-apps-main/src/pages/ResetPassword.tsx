import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/api/client'; 
import { toast } from 'sonner';

type Status = 'verifying' | 'valid' | 'invalid';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>('verifying');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // El token ahora viene de la URL como un query param 
  const token = searchParams.get('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setStatus('invalid');
        setErrorMsg('El enlace de recuperación no contiene un token válido.');
        return;
      }

      try {
        // Opcional: Podrías tener un endpoint para validar si el token expiró antes de mostrar el form
        // await api.get(`/auth/validate-reset-token?token=${token}`);
        setStatus('valid');
      } catch (err: any) {
        setStatus('invalid');
        setErrorMsg(err.response?.data?.error || 'El enlace ha expirado o no es válido.');
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'valid') return;
    
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      
      await api.post('/auth/reset-password', {
        token,
        password
      });

      toast.success('Contraseña actualizada correctamente');
      navigate('/auth'); 
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al actualizar la contraseña';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
            className={`mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-5 ${
              status === 'invalid' ? 'bg-destructive' : 'bg-primary glow-primary'
            }`}
          >
            {status === 'invalid' ? (
              <AlertCircle className="h-8 w-8 text-destructive-foreground" />
            ) : (
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            )}
          </motion.div>
          
          <h1 className="text-3xl font-heading text-foreground tracking-tight">
            {status === 'invalid' ? 'Enlace no válido' : 'Nueva contraseña'}
          </h1>
          
          <p className="text-sm text-muted-foreground mt-2">
            {status === 'verifying' && 'Verificando enlace...'}
            {status === 'valid' && 'Crea una nueva contraseña segura'}
            {status === 'invalid' && (errorMsg || 'El enlace ha expirado o no es válido.')}
          </p>
        </div>

        {status === 'valid' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Nueva contraseña</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 h-11 rounded-xl"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9 h-11 rounded-xl"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl glow-primary" disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Actualizar contraseña'}
            </Button>
          </form>
        )}

        {status === 'invalid' && (
          <div className="space-y-3">
            <Link to="/forgot-password">
              <Button className="w-full h-11 rounded-xl">Solicitar nuevo enlace</Button>
            </Link>
            <Link to="/auth" className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ArrowLeft className="h-4 w-4" /> Volver al inicio
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;