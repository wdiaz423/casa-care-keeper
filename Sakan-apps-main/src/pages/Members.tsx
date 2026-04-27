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

import { api } from '@/api/client'; 
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
  const selectedHome = useMemo(() => homes.find(h => Number(h.id) === selectedHomeId), [homes, selectedHomeId]);

  const {
    members, invitations, myRole, loading,
    inviteMember, cancelInvitation, updateMemberRole, removeMember, transferOwnership,
  } = useHomeMembers(selectedHomeId);

  const [stats, setStats] = useState<Map<number, MemberStats>>(new Map()); // Cambiado de string a number para MySQL
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<HomeRole>('member');
  const [inviting, setInviting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [tab, setTab] = useState('email');

  const isOwner = myRole === 'owner';
  const canManage = myRole === 'owner' || myRole === 'admin';

  // REFACTORIZACIÓN: Cargar estadísticas desde tu API de Node.js
  useEffect(() => {
    const loadStats = async () => {
      if (!selectedHomeId || members.length === 0) { 
        setStats(new Map()); 
        return; 
      }

      try {
        
        const response = await api.get(`/homes/${selectedHomeId}/member-stats`);
        
        const map = new Map<number, MemberStats>();
        
        response.data.forEach((s: any) => {
          map.set(Number(s.userId), { count: s.count, lastAt: s.lastAt });
        });
        setStats(map);
      } catch (err) {
        console.error("Error cargando estadísticas:", err);
      }
    };
    
    loadStats();
  }, [selectedHomeId, members.length]);

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const code = await inviteMember(inviteEmail.trim(), inviteRole);
      if (code) { 
        toast.success(`Invitación enviada a ${inviteEmail}`); 
        setInviteEmail(''); 
      }
    } catch (err) {
      toast.error('Error al enviar la invitación');
    } finally {
      setInviting(false);
    }
  };

  const handleGenerateLink = async () => {
    setInviting(true);
    try {
      const code = await inviteMember(null, inviteRole);
      if (code) { 
        setGeneratedCode(code); 
        toast.success('Código generado'); 
      }
    } finally {
      setInviting(false);
    }
  };

  const copyInviteLink = (code: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${code}`);
    toast.success('Enlace copiado');
  };

  const handleTransfer = async (memberId: number, name: string) => {
    const ok = await transferOwnership(memberId);
    if (ok) toast.success(`Propiedad transferida a ${name}`);
    else toast.error('No se pudo transferir la propiedad');
  };

  const handleRemove = async (memberId: number, name: string) => {
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
      {/* ... (El JSX se mantiene igual, solo asegúrate de que m.userId se compare como número) ... */}
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
          <div className="flex flex-col items-center justify-center py-20 gap-3">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
             <p className="text-muted-foreground">Cargando miembros...</p>
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Miembros del hogar
              </h2>
              <AnimatePresence>
                {members.map((m, i) => {
                  const info = ROLE_INFO[m.role];
                  const RoleIcon = info.icon;
                  const s = stats.get(Number(m.userId));
                  const isMe = Number(m.userId) === Number(user?.id);
                  

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
                            </div>
                          </div>

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
                            
                            {/* ... Resto de acciones (Transferir, Eliminar) usando m.id ... */}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </section>
            
            {/* ... Invitaciones y Formulario de invitación ... */}
          </>
        )}
      </main>
    </div>
  );
}