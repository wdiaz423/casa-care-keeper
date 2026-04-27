import { useState, useEffect, useCallback } from 'react';
import { api } from "@/api/client";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type HomeRole = 'owner' | 'admin' | 'member';

export interface HomeMember {
  id: number; 
  userId: number;
  role: HomeRole;
  displayName?: string;
  avatarUrl?: string | null;
  completedTasksCount?: number;
}

export function useHomeMembers(homeId: number | null) {
  const { user } = useAuth();
  const [members, setMembers] = useState<HomeMember[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]); // Para las invitaciones pendientes
  const [myRole, setMyRole] = useState<HomeRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!homeId) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/homes/${homeId}/members`);
      setMembers(data);
      
      const me = data.find((m: any) => m.userId === user?.id);
      if (me) setMyRole(me.role);
    } catch (err) {
      console.error("Error cargando miembros:", err);
    } finally {
      setLoading(false);
    }
  }, [user, homeId]);

  // --- NUEVAS FUNCIONES PARA EL FRONTEND ---

  //Invitar (Email o Generar Link)
  const inviteMember = async (email: string | null, role: HomeRole) => {
    try {
      const res = await api.post(`/api/invitations`, { homeId, email, role });
      // Si el backend devuelve el código generado
      return res.inviteCode; 
    } catch (err) {
      throw err;
    }
  };

  //Eliminar Miembro
  const removeMember = async (memberId: number) => {
    try {
      await api.delete(`/api/homes/${homeId}/members/${memberId}`);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success("Miembro eliminado");
    } catch (err) {
      toast.error("No se pudo eliminar al miembro");
    }
  };

  //Actualizar Rol
  const updateMemberRole = async (memberId: number, newRole: HomeRole) => {
    try {
      await api.put(`/api/homes/${homeId}/members/${memberId}`, { role: newRole });
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      toast.success("Rol actualizado");
    } catch (err) {
      toast.error("Error al actualizar rol");
    }
  };

  //Cancelar Invitación
  const cancelInvitation = async (invitationId: number) => {
    try {
      await api.delete(`/api/invitations/${invitationId}`);
      setInvitations(prev => prev.filter(i => i.id !== invitationId));
      toast.success("Invitación cancelada");
    } catch (err) {
      toast.error("Error al cancelar invitación");
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Dentro de useHomeMembers.ts
const transferOwnership = async (memberId: number): Promise<boolean> => {
  try {
    await api.post(`/api/homes/${homeId}/transfer-ownership`, { memberId });
  
    return true; // 
  } catch (err) {
    console.error(err);
    return false; // 
  }
};
  
  return { 
    members, 
    invitations, 
    myRole, 
    loading, 
    inviteMember, 
    removeMember, 
    updateMemberRole,
    cancelInvitation,
    refresh: fetchMembers,
    transferOwnership
  };
}