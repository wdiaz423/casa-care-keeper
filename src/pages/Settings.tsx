import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Camera, Save, Loader2, Moon, Sun, Users, Crown, Shield, ArrowRightLeft, Activity as ActivityIcon, CheckCircle2, Mail, Link2, Copy, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHomes } from '@/hooks/use-homes';
import { useHomeMembers, type HomeRole } from '@/hooks/use-home-members';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const ROLE_INFO: Record<HomeRole, { label: string; icon: typeof Crown; className: string }> = {
  owner: { label: 'Dueño', icon: Crown, className: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' },
  admin: { label: 'Admin', icon: Shield, className: 'text-primary bg-primary/10 border-primary/30' },
  member: { label: 'Miembro', icon: User, className: 'text-muted-foreground bg-muted/50 border-border/50' },
};

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

interface MemberStats {
  count: number;
  lastAt: string | null;
}

function MembersSection({ homeId }: { homeId: string | null }) {
  const { user } = useAuth();
  const { members, invitations, myRole, loading, inviteMember, cancelInvitation, updateMemberRole, removeMember, transferOwnership } = useHomeMembers(homeId);
  const [stats, setStats] = useState<Map<string, MemberStats>>(new Map());
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<HomeRole>('member');
  const [inviting, setInviting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const isOwner = myRole === 'owner';
  const canManage = myRole === 'owner' || myRole === 'admin';

  useEffect(() => {
    const loadStats = async () => {
      if (!homeId || members.length === 0) { setStats(new Map()); return; }
      const { data: tasks } = await supabase.from('maintenance_tasks').select('id').eq('home_id', homeId);
      const taskIds = (tasks || []).map(t => t.id);
      if (taskIds.length === 0) { setStats(new Map()); return; }
      const { data: history } = await supabase.from('completion_history').select('user_id, completed_at').in('task_id', taskIds).order('completed_at', { ascending: false });
      const map = new Map<string, MemberStats>();
      (history || []).forEach(h => {
        const existing = map.get(h.user_id);
        if (!existing) map.set(h.user_id, { count: 1, lastAt: h.completed_at });
        else { existing.count += 1; if (!existing.lastAt || h.completed_at > existing.lastAt) existing.lastAt = h.completed_at; }
      });
      setStats(map);
    };
    loadStats();
  }, [homeId, members.length]);

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const code = await inviteMember(inviteEmail.trim(), inviteRole);
    setInviting(false);
    if (code) { toast.success(`Invitación enviada a ${inviteEmail}`); setInviteEmail(''); }
    else toast.error('Error al enviar la invitación');
  };

  const handleGenerateLink = async () => {
    setInviting(true);
    const code = await inviteMember(null, inviteRole);
    setInviting(false);
    if (code) { setGeneratedCode(code); toast.success('Código generado'); }
  };

  const copyInviteLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${code}`);
    toast.success('Enlace copiado');
  };

  const handleTransfer = async (memberId: string, name: string) => {
    const ok = await transferOwnership(memberId);
    if (ok) toast.success(`Propiedad transferida a ${name}`);
    else toast.error('No se pudo transferir la propiedad');
  };

  const handleRemove = async (memberId: string, name: string) => {
    await removeMember(memberId);
    toast.success(`${name} fue removido del hogar`);
  };

  if (!homeId) return <div className="text-center py-10 text-muted-foreground">Selecciona un hogar para gestionar miembros.</div>;
  if (loading) return <p className="text-center text-muted-foreground py-10">Cargando...</p>;

  return (
    <div className="space-y-4">
      {/* Members List */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Miembros ({members.length})</h4>
        <AnimatePresence>
          {members.map((m, i) => {
            const info = ROLE_INFO[m.role];
            const RoleIcon = info.icon;
            const s = stats.get(m.userId);
            const isMe = m.userId === user?.id;
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ delay: i * 0.04 }} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 ring-2 ring-border/30">
                    {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt={m.displayName} />}
                    <AvatarFallback className="bg-primary/15 text-primary font-semibold text-xs">{getInitials(m.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground truncate text-sm">{m.displayName || 'Usuario'}</p>
                      {isMe && <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary">Tú</Badge>}
                      <Badge variant="outline" className={`text-[10px] h-5 gap-1 ${info.className}`}><RoleIcon className="h-3 w-3" />{info.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{s?.count || 0} tareas</span>
                      {s?.lastAt && <span className="flex items-center gap-1"><ActivityIcon className="h-3 w-3" />Última: hace {formatDistanceToNow(new Date(s.lastAt), { locale: es })}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isOwner && m.role !== 'owner' && (
                      <Select value={m.role} onValueChange={(v) => updateMemberRole(m.id, v as HomeRole)}>
                        <SelectTrigger className="h-7 w-[80px] text-xs bg-background/60 border-0"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="member">Miembro</SelectItem></SelectContent>
                      </Select>
                    )}
                    {isOwner && m.role !== 'owner' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Transferir propiedad"><ArrowRightLeft className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Transferir propiedad</AlertDialogTitle><AlertDialogDescription>Vas a convertir a <strong>{m.displayName || 'este usuario'}</strong> en el nuevo dueño del hogar. Tú pasarás a ser administrador.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleTransfer(m.id, m.displayName || 'Usuario')}>Transferir</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {canManage && m.role !== 'owner' && !isMe && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" title="Eliminar miembro"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Eliminar miembro</AlertDialogTitle><AlertDialogDescription>¿Seguro que deseas remover a <strong>{m.displayName || 'este usuario'}</strong> del hogar?</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleRemove(m.id, m.displayName || 'Usuario')}>Eliminar</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invitaciones pendientes ({invitations.length})</h4>
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center"><Mail className="h-4 w-4 text-amber-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.email || 'Enlace de invitación'}</p>
                  <p className="text-xs text-muted-foreground">Expira: {format(new Date(inv.expiresAt), "d MMM", { locale: es })} · {ROLE_INFO[inv.role].label}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyInviteLink(inv.inviteCode)}><Copy className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => cancelInvitation(inv.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite */}
      {canManage && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Invitar nuevos miembros</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rol:</span>
            <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as HomeRole)}>
              <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="member">Miembro</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email@ejemplo.com" className="flex-1" />
            <Button onClick={handleInviteByEmail} disabled={inviting || !inviteEmail.trim()} size="sm" className="gap-1.5">{inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}Invitar</Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleGenerateLink} disabled={inviting}><Link2 className="h-3.5 w-3.5" /></Button>
          </div>
          {generatedCode && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <code className="text-xs text-primary truncate flex-1">{window.location.origin}/join/{generatedCode}</code>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => copyInviteLink(generatedCode)}><Copy className="h-3 w-3" />Copiar</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { selectedHomeId } = useHomes();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    async function loadProfile() {
      const { data } = await supabase.from('profiles').select('display_name, avatar_url').eq('user_id', user!.id).maybeSingle();
      if (data) { setDisplayName(data.display_name || ''); setAvatarUrl(data.avatar_url || ''); }
      setLoading(false);
    }
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ display_name: displayName, avatar_url: avatarUrl || null }).eq('user_id', user.id);
    setSaving(false);
    if (error) toast.error('Error al guardar');
    else toast.success('Perfil actualizado');
  };

  const initials = (displayName || email || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-9 w-9 rounded-lg"><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex items-center gap-2">
            <motion.div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center" whileHover={{ scale: 1.1, rotate: 5 }}><User className="h-5 w-5 text-primary" /></motion.div>
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
                <CardTitle className="text-lg font-heading flex items-center gap-2"><User className="h-4 w-4 text-primary icon-animated" />Perfil de usuario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="h-16 w-16 rounded-2xl object-cover border-2 border-border/50" /> : <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-heading text-xl font-bold">{initials}</div>}
                    <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card border border-border/50 flex items-center justify-center"><Camera className="h-3 w-3 text-muted-foreground" /></div>
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-foreground">{displayName || 'Sin nombre'}</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nombre para mostrar</label>
                    <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Tu nombre" className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">URL del avatar</label>
                    <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." className="bg-background/50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <Input value={email} disabled className="bg-muted/30 cursor-not-allowed" />
                    <p className="text-xs text-muted-foreground">El email no se puede cambiar</p>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Guardar cambios</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Members Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <motion.div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center" whileHover={{ scale: 1.1 }}><Users className="h-4 w-4 text-primary" /></motion.div>
                Miembros del hogar
              </CardTitle>
            </CardHeader>
            <CardContent><MembersSection homeId={selectedHomeId} /></CardContent>
          </Card>
        </motion.div>

        {/* Theme Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <motion.div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center" whileHover={{ scale: 1.1, rotate: theme === 'dark' ? 10 : -10 }}>
                  {theme === 'dark' ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
                </motion.div>
                Tema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">{theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}</p>
                  <p className="text-sm text-muted-foreground">{theme === 'dark' ? 'Interfaz con colores oscuros y turquesa' : 'Interfaz con colores claros y cálidos'}</p>
                </div>
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} aria-label="Cambiar tema" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
