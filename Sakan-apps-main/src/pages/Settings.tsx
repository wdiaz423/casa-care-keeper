import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Camera, Save, Loader2, Moon, Sun, Users, Crown, Shield, ArrowRightLeft, Activity as ActivityIcon, CheckCircle2, Mail, Link2, Copy, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';


import { api } from '@/api/client'; 
import { useAuth } from '@/contexts/AuthContext';
import { useHomes } from '@/hooks/use-homes';
import { useTheme } from '@/hooks/use-theme';

import { useHomeMembers, type HomeRole } from '@/hooks/use-home-members'; 

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

// Constantes de UI se mantienen igual
const ROLE_INFO: Record<HomeRole, { label: string; icon: any; className: string }> = {
  owner: { label: 'Dueño', icon: Crown, className: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30' },
  admin: { label: 'Admin', icon: Shield, className: 'text-primary bg-primary/10 border-primary/30' },
  member: { label: 'Miembro', icon: User, className: 'text-muted-foreground bg-muted/50 border-border/50' },
};

function getInitials(name?: string) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

// --- SECCIÓN DE MIEMBROS ---
function MembersSection({ homeId }: { homeId: number | null }) {
  const { user } = useAuth();
  const { members, invitations, myRole, loading, inviteMember, cancelInvitation, updateMemberRole, removeMember, transferOwnership } = useHomeMembers(homeId);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<HomeRole>('member');
  const [inviting, setInviting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const isOwner = myRole === 'owner';
  const canManage = myRole === 'owner' || myRole === 'admin';

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      // Ahora inviteMember debe llamar a POST /api/invitations
      await inviteMember(inviteEmail.trim(), inviteRole);
      toast.success(`Invitación enviada`);
      setInviteEmail('');
    } catch (err) {
      toast.error('Error al invitar');
    } finally {
      setInviting(false);
    }
  };

  const handleGenerateLink = async () => {
    setInviting(true);
    const code = await inviteMember(null, inviteRole);
    setInviting(false);
    if (code) { setGeneratedCode(code); toast.success('Enlace generado'); }
  };

  const handleTransfer = async (memberId: number, name: string) => {
  try {
    await transferOwnership(memberId);
    toast.success(`Ahora ${name} es el dueño del hogar`);
  } catch (err) {
    toast.error('No se pudo transferir la propiedad');
  }
};

  const copyInviteLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${code}`);
    toast.success('Enlace copiado');
  };

  if (!homeId) return <div className="text-center py-10 text-muted-foreground">Selecciona un hogar.</div>;
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>;

 return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase">Miembros ({members.length})</h4>
        <AnimatePresence>
          {members.map((m) => (
            <div key={m.id} className="p-3 rounded-lg bg-muted/30 border border-border/30 flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={m.avatarUrl || undefined} />
                <AvatarFallback>{getInitials(m.displayName)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{m.displayName}</span>
                  <Badge variant="outline" className={`text-[10px] h-5 ${ROLE_INFO[m.role].className}`}>
                    {ROLE_INFO[m.role].label}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">
                   {m.completedTasksCount || 0} tareas completadas
                </p>
              </div>

              {/* ACCIONES */}
              <div className="flex items-center gap-1">
                {/* Botón Transferir (Solo visible para el Owner actual) */}
                {isOwner && Number(m.userId) !== Number(user?.id) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Transferir propiedad</AlertDialogTitle>
                        <AlertDialogDescription>
                          Vas a convertir a <strong>{m.displayName}</strong> en el nuevo dueño. 
                          Tú pasarás a ser administrador.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleTransfer(m.id, m.displayName || 'Usuario')}>
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {/* Botón Eliminar (Owner o Admin pueden eliminar a otros) */}
                {canManage && Number(m.userId) !== Number(user?.id) && m.role !== 'owner' && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => removeMember(m.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input para invitar */}
      {canManage && (
        <div className="pt-4 border-t border-border/50 space-y-3">
          <div className="flex gap-2">
            <Input 
              value={inviteEmail} 
              onChange={e => setInviteEmail(e.target.value)} 
              placeholder="email@ejemplo.com"
            />
            <Button onClick={handleInviteByEmail} disabled={inviting}>
              {inviting ? <Loader2 className="animate-spin h-4 w-4" /> : "Invitar"}
            </Button>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={handleGenerateLink}>
            <Link2 className="h-4 w-4" /> Generar enlace público
          </Button>
          {generatedCode && (
            <div className="p-2 bg-primary/10 rounded border border-primary/20 flex justify-between items-center">
              <span className="text-xs truncate">.../join/{generatedCode}</span>
              <Button size="sm" onClick={() => copyInviteLink(generatedCode)}><Copy className="h-3 w-3" /></Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { selectedHomeId } = useHomes();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '');
      // El avatar_url debería venir ahora en tu AuthUser si lo configuraste
      setAvatarUrl(user.avatarUrl || ''); 
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Llamada a tu nueva API de Node.js
      await api.put('/users/profile', { name: displayName, avatarUrl });
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error('Error al guardar perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="p-4 border-b flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft /></Button>
        <h1 className="text-xl font-bold">Configuración</h1>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Card de Perfil */}
        <Card>
          <CardHeader><CardTitle>Mi Perfil</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm">Nombre</label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Avatar URL</label>
              <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : "Guardar Cambios"}
            </Button>
          </CardContent>
        </Card>

        {/* Sección de Miembros */}
        <Card>
          <CardHeader><CardTitle>Miembros del Hogar</CardTitle></CardHeader>
          <CardContent>
            <MembersSection homeId={selectedHomeId ? Number(selectedHomeId) : null} />
          </CardContent>
        </Card>

        {/* Tema */}
        <Card>
          <CardContent className="pt-6 flex justify-between items-center">
            <span>Modo Oscuro</span>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


