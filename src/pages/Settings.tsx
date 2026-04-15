import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Camera, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    async function loadProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name || '');
        setAvatarUrl(data.avatar_url || '');
      }
      setLoading(false);
    }
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName, avatar_url: avatarUrl || null })
      .eq('user_id', user.id);
    setSaving(false);
    if (error) {
      toast.error('Error al guardar');
    } else {
      toast.success('Perfil actualizado');
    }
  };

  const initials = (displayName || email || '?')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-9 w-9 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <motion.div
              className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <User className="h-5 w-5 text-primary" />
            </motion.div>
            <h1 className="text-xl font-heading text-foreground">Configuración</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Cargando...</div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <User className="h-4 w-4 text-primary icon-animated" />
                  Perfil de usuario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar preview */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-16 w-16 rounded-2xl object-cover border-2 border-border/50" />
                    ) : (
                      <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-heading text-xl font-bold">
                        {initials}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card border border-border/50 flex items-center justify-center">
                      <Camera className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-foreground">{displayName || 'Sin nombre'}</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nombre para mostrar</label>
                    <Input
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      placeholder="Tu nombre"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">URL del avatar</label>
                    <Input
                      value={avatarUrl}
                      onChange={e => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <Input value={email} disabled className="bg-muted/30 cursor-not-allowed" />
                    <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar cambios
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
