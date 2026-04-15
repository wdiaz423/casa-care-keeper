import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function JoinHome() {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'found' | 'accepting' | 'success' | 'error' | 'expired'>('loading');
  const [invitation, setInvitation] = useState<any>(null);
  const [homeName, setHomeName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Save invite code and redirect to auth
      localStorage.setItem('pending-invite', code || '');
      navigate('/auth');
      return;
    }
    loadInvitation();
  }, [user, authLoading, code]);

  const loadInvitation = async () => {
    if (!code) { setStatus('error'); return; }

    const { data: inv } = await supabase
      .from('home_invitations')
      .select('*')
      .eq('invite_code', code)
      .eq('status', 'pending')
      .single();

    if (!inv) { setStatus('error'); setErrorMsg('Invitación no encontrada o ya usada'); return; }
    if (new Date(inv.expires_at) < new Date()) { setStatus('expired'); return; }

    const { data: home } = await supabase.from('homes').select('name').eq('id', inv.home_id).single();
    setHomeName(home?.name || 'Hogar');
    setInvitation(inv);
    setStatus('found');
  };

  const handleAccept = async () => {
    if (!user || !invitation) return;
    setStatus('accepting');

    // Insert member directly
    const { error: memberError } = await supabase.from('home_members').insert({
      home_id: invitation.home_id,
      user_id: user.id,
      role: invitation.role,
    });

    if (memberError) {
      if (memberError.code === '23505') {
        // Already a member
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg('No se pudo unir al hogar');
        return;
      }
    }

    // Mark invitation as accepted
    await supabase.from('home_invitations').update({ status: 'accepted' }).eq('id', invitation.id);
    setStatus('success');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="glass-card w-full max-w-sm">
          <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
            {status === 'loading' && (
              <>
                <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
                <p className="text-muted-foreground">Verificando invitación...</p>
              </>
            )}
            {status === 'found' && (
              <>
                <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
                  <Home className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-heading font-bold text-foreground">Te han invitado</h2>
                <p className="text-muted-foreground text-sm">
                  Has sido invitado a unirte a <span className="text-foreground font-medium">{homeName}</span> como{' '}
                  <span className="text-primary font-medium">
                    {invitation.role === 'admin' ? 'Admin' : 'Miembro'}
                  </span>
                </p>
                <Button onClick={handleAccept} className="w-full gap-2 mt-2">
                  <CheckCircle className="h-4 w-4" /> Aceptar invitación
                </Button>
                <Button variant="ghost" onClick={() => navigate('/')} className="w-full text-muted-foreground">
                  Cancelar
                </Button>
              </>
            )}
            {status === 'accepting' && (
              <>
                <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
                <p className="text-muted-foreground">Uniéndote al hogar...</p>
              </>
            )}
            {status === 'success' && (
              <>
                <div className="h-14 w-14 rounded-2xl bg-success/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-7 w-7 text-success" />
                </div>
                <h2 className="text-xl font-heading font-bold text-foreground">¡Bienvenido!</h2>
                <p className="text-muted-foreground text-sm">Te has unido a {homeName} exitosamente.</p>
                <Button onClick={() => navigate('/')} className="w-full mt-2">Ir al inicio</Button>
              </>
            )}
            {(status === 'error' || status === 'expired') && (
              <>
                <div className="h-14 w-14 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto">
                  <XCircle className="h-7 w-7 text-destructive" />
                </div>
                <h2 className="text-xl font-heading font-bold text-foreground">
                  {status === 'expired' ? 'Invitación expirada' : 'Error'}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {status === 'expired' ? 'Esta invitación ha expirado. Pide al dueño que te envíe una nueva.' : errorMsg}
                </p>
                <Button variant="ghost" onClick={() => navigate('/')} className="w-full">Ir al inicio</Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
