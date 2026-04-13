import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Home } from '@/lib/types';

export function useHomes() {
  const { user } = useAuth();
  const [homes, setHomes] = useState<Home[]>([]);
  const [selectedHomeId, setSelectedHomeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHomes = useCallback(async () => {
    if (!user) { setHomes([]); setLoading(false); return; }
    setLoading(true);

    const { data, error } = await supabase
      .from('homes')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) { console.error(error); setLoading(false); return; }

    const mapped: Home[] = (data || []).map(h => ({
      id: h.id,
      name: h.name,
      address: h.address || undefined,
      color: h.color,
      icon: h.icon,
    }));

    setHomes(mapped);

    // Auto-select first home if none selected
    if (mapped.length > 0 && !selectedHomeId) {
      const saved = localStorage.getItem(`selected-home-${user.id}`);
      const valid = saved && mapped.some(h => h.id === saved);
      setSelectedHomeId(valid ? saved : mapped[0].id);
    }

    setLoading(false);
  }, [user, selectedHomeId]);

  useEffect(() => { fetchHomes(); }, [fetchHomes]);

  const selectHome = useCallback((id: string | null) => {
    setSelectedHomeId(id);
    if (user && id) localStorage.setItem(`selected-home-${user.id}`, id);
  }, [user]);

  const addHome = async (home: Omit<Home, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('homes').insert({
      user_id: user.id,
      name: home.name,
      address: home.address || null,
      color: home.color,
      icon: home.icon,
    }).select().single();

    if (!error && data) {
      await fetchHomes();
      setSelectedHomeId(data.id);
      if (user) localStorage.setItem(`selected-home-${user.id}`, data.id);
    }
  };

  const updateHome = async (id: string, updates: Partial<Omit<Home, 'id'>>) => {
    const { error } = await supabase.from('homes').update({
      name: updates.name,
      address: updates.address ?? undefined,
      color: updates.color,
      icon: updates.icon,
    }).eq('id', id);
    if (!error) fetchHomes();
  };

  const deleteHome = async (id: string) => {
    const { error } = await supabase.from('homes').delete().eq('id', id);
    if (!error) {
      if (selectedHomeId === id) {
        const remaining = homes.filter(h => h.id !== id);
        setSelectedHomeId(remaining.length > 0 ? remaining[0].id : null);
      }
      fetchHomes();
    }
  };

  return { homes, selectedHomeId, selectHome, addHome, updateHome, deleteHome, loading };
}
