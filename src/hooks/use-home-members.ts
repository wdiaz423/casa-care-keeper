import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type HomeRole = 'owner' | 'admin' | 'member';

export interface HomeMember {
  id: string;
  homeId: string;
  userId: string;
  role: HomeRole;
  displayName?: string;
  email?: string;
  avatarUrl?: string | null;
  joinedAt?: string;
}

export interface HomeInvitation {
  id: string;
  homeId: string;
  email: string | null;
  role: HomeRole;
  inviteCode: string;
  status: string;
  invitedBy: string;
  expiresAt: string;
  createdAt: string;
}

export function useHomeMembers(homeId: string | null) {
  const { user } = useAuth();
  const [members, setMembers] = useState<HomeMember[]>([]);
  const [invitations, setInvitations] = useState<HomeInvitation[]>([]);
  const [myRole, setMyRole] = useState<HomeRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!user || !homeId) { setMembers([]); setInvitations([]); setLoading(false); return; }
    setLoading(true);

    const { data: membersData } = await supabase
      .from('home_members')
      .select('*')
      .eq('home_id', homeId)
      .order('created_at', { ascending: true });

    const membersList: HomeMember[] = (membersData || []).map(m => ({
      id: m.id,
      homeId: m.home_id,
      userId: m.user_id,
      role: m.role as HomeRole,
      joinedAt: m.created_at,
    }));

    // Fetch profiles for display names + avatars
    const userIds = membersList.map(m => m.userId);
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);
      
      profiles?.forEach(p => {
        const member = membersList.find(m => m.userId === p.user_id);
        if (member) {
          member.displayName = p.display_name || undefined;
          member.avatarUrl = p.avatar_url || null;
        }
      });
    }

    setMembers(membersList);
    setMyRole(membersList.find(m => m.userId === user.id)?.role || null);

    const { data: invData } = await supabase
      .from('home_invitations')
      .select('*')
      .eq('home_id', homeId)
      .eq('status', 'pending');

    setInvitations((invData || []).map(i => ({
      id: i.id,
      homeId: i.home_id,
      email: i.email,
      role: i.role as HomeRole,
      inviteCode: i.invite_code,
      status: i.status,
      invitedBy: i.invited_by,
      expiresAt: i.expires_at,
      createdAt: i.created_at,
    })));

    setLoading(false);
  }, [user, homeId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const inviteMember = async (email: string | null, role: HomeRole) => {
    if (!user || !homeId) return null;
    const { data, error } = await supabase
      .from('home_invitations')
      .insert({
        home_id: homeId,
        email: email || null,
        role,
        invited_by: user.id,
      })
      .select()
      .single();

    if (!error && data) {
      await fetchMembers();
      return data.invite_code;
    }
    return null;
  };

  const cancelInvitation = async (id: string) => {
    await supabase.from('home_invitations').update({ status: 'cancelled' }).eq('id', id);
    fetchMembers();
  };

  const updateMemberRole = async (memberId: string, role: HomeRole) => {
    await supabase.from('home_members').update({ role }).eq('id', memberId);
    fetchMembers();
  };

  const removeMember = async (memberId: string) => {
    await supabase.from('home_members').delete().eq('id', memberId);
    fetchMembers();
  };

  const transferOwnership = async (newOwnerMemberId: string) => {
    if (!user) return false;
    const me = members.find(m => m.userId === user.id);
    const target = members.find(m => m.id === newOwnerMemberId);
    if (!me || me.role !== 'owner' || !target) return false;
    // Promote target to owner; demote myself to admin
    const { error: e1 } = await supabase.from('home_members').update({ role: 'owner' }).eq('id', target.id);
    if (e1) return false;
    const { error: e2 } = await supabase.from('home_members').update({ role: 'admin' }).eq('id', me.id);
    if (e2) return false;
    await fetchMembers();
    return true;
  };

  const acceptInvitation = async (inviteCode: string) => {
    if (!user) return false;
    const { data: inv } = await supabase
      .from('home_invitations')
      .select('*')
      .eq('invite_code', inviteCode)
      .eq('status', 'pending')
      .single();

    if (!inv) return false;
    if (new Date(inv.expires_at) < new Date()) return false;

    // This is handled in JoinHome page directly
    return true;
  };

  return {
    members,
    invitations,
    myRole,
    loading,
    inviteMember,
    cancelInvitation,
    updateMemberRole,
    removeMember,
    transferOwnership,
    acceptInvitation,
    refresh: fetchMembers,
  };
}
