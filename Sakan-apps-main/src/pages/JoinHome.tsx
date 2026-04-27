import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

export default function JoinHome() {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'found' | 'accepting' | 'success' | 'error' | 'expired'>('loading');
  const [invitation, setInvitation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;

    
    if (!user) {
      localStorage.setItem('pending-invite', code || '');
      navigate('/auth');
      return;
    }

    loadInvitation();
  }, [user, authLoading, code]);

  const loadInvitation = async () => {
    if (!code) {
      setStatus('error');
      setErrorMsg('Código de invitación inválido');
      return;
    }

    try {
      // GET /api/invitations/:code
      const data = await api.get(`invitations/${code}`);
      
      setInvitation(data);
      setStatus('found');
    } catch (err: any) {
      if (err.status === 410 || err.data?.message?.includes('expirada')) {
        setStatus('expired');
      } else {
        setStatus('error');
        setErrorMsg(err.data?.message || 'Invitación no encontrada');
      }
    }
  };

  const handleAccept = async () => {
    if (!user || !invitation) return;
    setStatus('accepting');

    try {
      // POST /api/invitations/:code/accept
      await api.post(`invitations/${code}/accept`, {});
      
      setStatus('success');
      toast.success('¡Te has unido al hogar!');
      
      
      localStorage.removeItem('pending-invite');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.data?.message || 'No se pudo procesar la invitación');
      toast.error('Error al unirse');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-xl w-full max-w-sm overflow-hidden shadow-2xl">
          <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
            
            {status === 'loading' && (
              <div className="py-8">
                <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
                <p className="text-muted-foreground mt-4 text-sm">Validando invitación...</p>
              </div>
            )}

            {status === 'found' && (
              <>
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <Home className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-heading font-bold text-foreground">Invitación recibida</h2>
                  <p className="text-muted-foreground text-sm">
                    Has sido invitado a <span className="text-foreground font-semibold">{invitation.homeName}</span>
                  </p>
                </div>
                
                <div className="bg-accent/30 rounded-xl p-3 text-xs flex justify-between items-center">
                  <span className="text-muted-foreground">Rol asignado:</span>
                  <span className="font-bold uppercase tracking-wider text-primary">
                    {invitation.role === 'admin' ? 'Administrador' : 'Miembro'}
                  </span>
                </div>

                <Button onClick={handleAccept} className="w-full gap-2 h-11 rounded-xl shadow-lg shadow-primary/20">
                  <CheckCircle className="h-4 w-4" /> Aceptar y Entrar
                </Button>
                <Button variant="ghost" onClick={() => navigate('/')} className="w-full text-muted-foreground h-11">
                  En otro momento
                </Button>
              </>
            )}

            {status === 'accepting' && (
              <div className="py-8">
                <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
                <p className="text-muted-foreground mt-4">Configurando tu acceso...</p>
              </div>
            )}

            {status === 'success' && (
              <>
                <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-heading font-bold text-foreground">¡Todo listo!</h2>
                  <p className="text-muted-foreground text-sm">Ahora eres parte de {invitation?.homeName}.</p>
                </div>
                <Button onClick={() => navigate('/')} className="w-full h-11 rounded-xl mt-2">
                  Ir al Dashboard
                </Button>
              </>
            )}

            {(status === 'error' || status === 'expired') && (
              <>
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-heading font-bold text-foreground">
                    {status === 'expired' ? 'Invitación caducada' : 'No se pudo unir'}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {status === 'expired' 
                      ? 'Este código ha expirado por seguridad.' 
                      : errorMsg}
                  </p>
                </div>
                <Button variant="outline" onClick={() => navigate('/')} className="w-full h-11 rounded-xl">
                  Volver al inicio
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}