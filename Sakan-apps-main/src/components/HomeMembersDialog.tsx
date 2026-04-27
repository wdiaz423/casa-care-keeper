import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Copy, Mail, Link2, Crown, Shield, User, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHomeMembers, type HomeRole } from '@/hooks/use-home-members';
import { toast } from 'sonner';

const ROLE_LABELS: Record<HomeRole, { label: string; icon: typeof Crown; color: string }> = {
  owner: { label: 'Dueño', icon: Crown, color: 'text-yellow-500' },
  admin: { label: 'Admin', icon: Shield, color: 'text-primary' },
  member: { label: 'Miembro', icon: User, color: 'text-muted-foreground' },
};

interface Props {
  homeId: string | null;
  homeName: string;
}

export function HomeMembersDialog({ homeId, homeName }: Props) {
  const { members, invitations, myRole, loading, inviteMember, cancelInvitation, updateMemberRole, removeMember } = useHomeMembers(homeId);
  const [open, setOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<HomeRole>('member');
  const [inviting, setInviting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [inviteTab, setInviteTab] = useState<string>('email');

  const canManage = myRole === 'owner' || myRole === 'admin';
  const isOwner = myRole === 'owner';

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const code = await inviteMember(inviteEmail.trim(), inviteRole);
    setInviting(false);
    if (code) {
      toast.success(`Invitación enviada a ${inviteEmail}`);
      setInviteEmail('');
    } else {
      toast.error('Error al enviar la invitación');
    }
  };

  const handleGenerateLink = async () => {
    setInviting(true);
    const code = await inviteMember(null, inviteRole);
    setInviting(false);
    if (code) {
      setGeneratedCode(code);
      toast.success('Código de invitación generado');
    }
  };

  const copyInviteLink = (code: string) => {
    const url = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(url);
    toast.success('Enlace copiado al portapapeles');
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground" title="Gestionar miembros">
          <Users className="h-4 w-4 icon-bounce" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg glass-card">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Users className="h-5 w-5 text-primary icon-animated" />
            Miembros de {homeName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Members list */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Miembros actuales</h3>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground text-sm">Cargando...</div>
            ) : (
              <AnimatePresence>
                {members.map((m, i) => {
                  const roleInfo = ROLE_LABELS[m.role];
                  const RoleIcon = roleInfo.icon;
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-background/50 border border-border/30"
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-card ${roleInfo.color}`}>
                        <RoleIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {m.displayName || 'Usuario'}
                        </p>
                        <p className="text-xs text-muted-foreground">{roleInfo.label}</p>
                      </div>
                      {isOwner && m.role !== 'owner' && (
                        <div className="flex items-center gap-1">
                          <Select
                            value={m.role}
                            onValueChange={(v) => updateMemberRole(m.id, v as HomeRole)}
                          >
                            <SelectTrigger className="h-7 w-[100px] text-xs bg-card/50 border-border/30">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Miembro</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive/70 hover:text-destructive"
                            onClick={() => removeMember(m.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Invitaciones pendientes</h3>
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-background/50 border border-border/30">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                    {inv.email ? <Mail className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{inv.email || 'Enlace de invitación'}</p>
                    <p className="text-xs text-muted-foreground">{ROLE_LABELS[inv.role].label} • Expira {new Date(inv.expiresAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyInviteLink(inv.inviteCode)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    {canManage && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70" onClick={() => cancelInvitation(inv.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Invite new member */}
          {canManage && (
            <div className="space-y-3 border-t border-border/30 pt-4">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary icon-animated" />
                Invitar miembro
              </h3>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">Rol:</span>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as HomeRole)}>
                  <SelectTrigger className="h-8 w-[120px] text-xs bg-card/50 border-border/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Miembro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Tabs value={inviteTab} onValueChange={setInviteTab}>
                <TabsList className="grid w-full grid-cols-2 h-9">
                  <TabsTrigger value="email" className="text-xs gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </TabsTrigger>
                  <TabsTrigger value="link" className="text-xs gap-1.5">
                    <Link2 className="h-3.5 w-3.5" /> Código/Link
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="email" className="mt-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="email@ejemplo.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="bg-background/50 text-sm h-9"
                      onKeyDown={e => e.key === 'Enter' && handleInviteByEmail()}
                    />
                    <Button size="sm" onClick={handleInviteByEmail} disabled={inviting || !inviteEmail.trim()} className="h-9">
                      {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Invitar'}
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="link" className="mt-3 space-y-3">
                  <Button size="sm" variant="outline" onClick={handleGenerateLink} disabled={inviting} className="w-full h-9 gap-2">
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    Generar código de invitación
                  </Button>
                  {generatedCode && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-primary flex-1 break-all">{generatedCode}</code>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyInviteCode(generatedCode)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="sm" className="w-full h-7 text-xs gap-1.5" onClick={() => copyInviteLink(generatedCode)}>
                        <Link2 className="h-3 w-3" /> Copiar enlace completo
                      </Button>
                    </motion.div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
