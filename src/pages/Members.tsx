import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, Crown, Shield, User as UserIcon, UserPlus, Mail, Link2,
  Copy, Trash2, Loader2, ArrowRightLeft, Activity as ActivityIcon, CheckCircle2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHomes } from '@/hooks/use-homes';
import { useHomeMembers, type HomeRole } from '@/hooks/use-home-members';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

const ROLE_INFO: Record<HomeRole, { label: string; icon: typeof Crown; className: string }> = {
  owner: { label: 'Dueño', icon: Crown, className: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' },
  admin: { label: 'Admin', icon: Shield, className: 'text-primary bg-primary/10 border-primary/30' },
  member: { label: 'Miembro', icon: UserIcon, className: 'text-muted-foreground bg-muted/50 border-border/50' },
};

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

interface MemberStats {
  count: number;
  lastAt: string | null;
}

export default function Members() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { homes, selectedHomeId } = useHomes();
  const selectedHome = useMemo(() => homes.find(h => h.id === selectedHomeId), [homes, selectedHomeId]);

  const {
    members, invitations, myRole, loading,
    inviteMember, cancelInvitation, updateMemberRole, removeMember, transferOwnership,
  } = useHomeMembers(selectedHomeId);

  const [stats, setStats] = useState<Map<string, MemberStats>>(new Map());
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<HomeRole>('member');
  const [inviting, setInviting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [tab, setTab] = useState('email');

  const isOwner = myRole === 'owner';
  const canManage = myRole === 'owner' || myRole === 'admin';

  useEffect(() => {
    const loadStats = async () => {
      if (!selectedHomeId || members.length === 0) { setStats(new Map()); return; }
      const { data: tasks } = await supabase
        .from('maintenance_tasks').select('id').eq('home_id', selectedHomeId);
      const taskIds = (tasks || []).map(t => t.id);
      if (taskIds.length === 0) { setStats(new Map()); return; }

      const { data: history } = await supabase
        .from('completion_history')
        .select('user_id, completed_at')
        .in('task_id', taskIds)
        .order('completed_at', { ascending: false });

      const map = new Map<string, MemberStats>();
      (history || []).forEach(h => {
        const existing = map.get(h.user_id);
        if (!existing) map.set(h.user_id, { count: 1, lastAt: h.completed_at });
        else { existing.count += 1; if (!existing.lastAt || h.completed_at > existing.lastAt) existing.lastAt = h.completed_at; }
      });
      setStats(map);
    };
    loadStats();
  }, [selectedHomeId, members.length]);

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

  if (!selectedHomeId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Selecciona un hogar primero.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-9 w-9 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: selectedHome?.color || 'hsl(var(--primary))' }}
            >
              <Users className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-lg leading-tight">Miembros</h1>
              <p className="text-xs text-muted-foreground">{selectedHome?.name || 'Hogar'}</p>
            </div>
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <p className="text-center text-muted-foreground py-20">Cargando...</p>
        ) : (
          <>
            {/* MEMBERS LIST */}
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Miembros del hogar
              </h2>
              <AnimatePresence>
                {members.map((m, i) => {
                  const info = ROLE_INFO[m.role];
                  const RoleIcon = info.icon;
                  const s = stats.get(m.userId);
                  const isMe = m.userId === user?.id;
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <Card className="p-4 hover:shadow-lg hover:shadow-primary/5 transition-all bg-card/80 backdrop-blur-sm border-border/50">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 ring-2 ring-border/30">
                            {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt={m.displayName} />}
                            <AvatarFallback className="bg-primary/15 text-primary font-semibold">
                              {getInitials(m.displayName)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-foreground truncate">
                                {m.displayName || 'Usuario'}
                              </p>
                              {isMe && (
                                <Badge variant="outline" className="text-[10px] h-5 border-primary/30 text-primary">
                                  Tú
                                </Badge>
                              )}
                              <Badge variant="outline" className={`text-[10px] h-5 gap-1 ${info.className}`}>
                                <RoleIcon className="h-3 w-3" />
                                {info.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                {s?.count || 0} tareas completadas
                              </span>
                              {s?.lastAt && (
                                <span className="flex items-center gap-1">
                                  <ActivityIcon className="h-3 w-3" />
                                  Última: hace {formatDistanceToNow(new Date(s.lastAt), { locale: es })}
                                </span>
                              )}
                              {m.joinedAt && (
                                <span>Se unió {format(new Date(m.joinedAt), "d MMM yyyy", { locale: es })}</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isOwner && m.role !== 'owner' && (
                              <Select value={m.role} onValueChange={(v) => updateMemberRole(m.id, v as HomeRole)}>
                                <SelectTrigger className="h-8 w-[110px] text-xs bg-background/60">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="member">Miembro</SelectItem>
                                </SelectContent>
                              </Select>
                            )}

                            {isOwner && m.role !== 'owner' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" title="Transferir propiedad">
                                    <ArrowRightLeft className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Transferir propiedad</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Vas a convertir a <strong>{m.displayName || 'este usuario'}</strong> en el nuevo dueño del hogar.
                                      Tú pasarás a ser administrador. Esta acción no se puede deshacer fácilmente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleTransfer(m.id, m.displayName || 'Usuario')}>
                                      Transferir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}

                            {canManage && m.role !== 'owner' && !isMe && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" title="Eliminar miembro">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Eliminar miembro</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      ¿Seguro que deseas remover a <strong>{m.displayName || 'este usuario'}</strong> del hogar?
                                      Perderá acceso a las tareas inmediatamente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => handleRemove(m.id, m.displayName || 'Usuario')}
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </section>

            {/* PENDING INVITATIONS */}
            {invitations.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Invitaciones pendientes
                </h2>
                {invitations.map(inv => (
                  <Card key={inv.id} className="p-3 flex items-center gap-3 bg-card/60 border-border/50">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      {inv.email ? <Mail className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{inv.email || 'Enlace de invitación'}</p>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_INFO[inv.role].label} · expira {format(new Date(inv.expiresAt), 'd MMM', { locale: es })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyInviteLink(inv.inviteCode)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {canManage && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70" onClick={() => cancelInvitation(inv.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </Card>
                ))}
              </section>
            )}

            {/* INVITE FORM */}
            {canManage && (
              <section className="space-y-3">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Invitar nuevo miembro
                </h2>
                <Card className="p-4 bg-card/80 border-border/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Rol:</span>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as HomeRole)}>
                      <SelectTrigger className="h-8 w-[130px] text-xs bg-background/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="member">Miembro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="grid w-full grid-cols-2 h-9">
                      <TabsTrigger value="email" className="text-xs gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> Por email
                      </TabsTrigger>
                      <TabsTrigger value="link" className="text-xs gap-1.5">
                        <Link2 className="h-3.5 w-3.5" /> Por enlace
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="email" className="mt-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="email@ejemplo.com"
                          value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          className="bg-background/60 text-sm h-9"
                          onKeyDown={e => e.key === 'Enter' && handleInviteByEmail()}
                        />
                        <Button size="sm" onClick={handleInviteByEmail} disabled={inviting || !inviteEmail.trim()} className="h-9">
                          {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invitar'}
                        </Button>
                      </div>
                    </TabsContent>
                    <TabsContent value="link" className="mt-3 space-y-2">
                      <Button size="sm" variant="outline" onClick={handleGenerateLink} disabled={inviting} className="w-full h-9 gap-2">
                        {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                        Generar enlace de invitación
                      </Button>
                      {generatedCode && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2"
                        >
                          <code className="text-xs font-mono text-primary block break-all">{generatedCode}</code>
                          <Button variant="ghost" size="sm" className="w-full h-7 text-xs gap-1.5" onClick={() => copyInviteLink(generatedCode)}>
                            <Copy className="h-3 w-3" /> Copiar enlace completo
                          </Button>
                        </motion.div>
                      )}
                    </TabsContent>
                  </Tabs>
                </Card>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
