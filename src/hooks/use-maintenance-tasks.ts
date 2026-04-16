import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { MaintenanceTask, CompletionRecord } from '@/lib/types';

export function useMaintenanceTasks(homeId?: string | null) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) { setTasks([]); setLoading(false); return; }
    setLoading(true);

    let query = supabase.from('maintenance_tasks').select('*').order('created_at', { ascending: false });
    
    if (homeId) {
      query = query.eq('home_id', homeId);
    }

    const { data: dbTasks, error } = await query;

    if (error) { console.error(error); setLoading(false); return; }

    const taskIds = (dbTasks || []).map(t => t.id);
    const { data: history } = taskIds.length > 0
      ? await supabase.from('completion_history').select('*').in('task_id', taskIds).order('completed_at', { ascending: false })
      : { data: [] };

    const userIds = Array.from(new Set((history || []).map(h => h.user_id)));
    const { data: profiles } = userIds.length > 0
      ? await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds)
      : { data: [] as { user_id: string; display_name: string | null; avatar_url: string | null }[] };
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    const historyMap = new Map<string, CompletionRecord[]>();
    (history || []).forEach(h => {
      const arr = historyMap.get(h.task_id) || [];
      const p = profileMap.get(h.user_id);
      arr.push({
        id: h.id,
        date: h.completed_at,
        notes: h.notes || undefined,
        userId: h.user_id,
        completedByName: p?.display_name || 'Usuario',
        completedByAvatar: p?.avatar_url || null,
      });
      historyMap.set(h.task_id, arr);
    });

    const mapped: MaintenanceTask[] = (dbTasks || []).map(t => ({
      id: t.id,
      title: t.title,
      category: t.category as MaintenanceTask['category'],
      description: t.description || undefined,
      frequencyValue: t.frequency_value,
      frequencyUnit: t.frequency_unit as MaintenanceTask['frequencyUnit'],
      lastCompleted: t.last_completed,
      completionHistory: historyMap.get(t.id) || [],
      notes: t.notes || undefined,
      homeId: t.home_id || undefined,
    }));

    setTasks(mapped);
    setLoading(false);
  }, [user, homeId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (task: MaintenanceTask) => {
    if (!user) return;
    const { error } = await supabase.from('maintenance_tasks').insert({
      user_id: user.id,
      title: task.title,
      category: task.category,
      description: task.description || null,
      frequency_value: task.frequencyValue,
      frequency_unit: task.frequencyUnit,
      last_completed: task.lastCompleted,
      notes: task.notes || null,
      home_id: task.homeId || homeId || null,
    });
    if (!error) fetchTasks();
  };

  const updateTask = async (id: string, updates: Partial<MaintenanceTask>) => {
    const { error } = await supabase.from('maintenance_tasks').update({
      title: updates.title,
      category: updates.category,
      description: updates.description ?? undefined,
      frequency_value: updates.frequencyValue,
      frequency_unit: updates.frequencyUnit,
      last_completed: updates.lastCompleted,
      notes: updates.notes ?? undefined,
    }).eq('id', id);
    if (!error) fetchTasks();
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('maintenance_tasks').delete().eq('id', id);
    if (!error) fetchTasks();
  };

  const markCompleted = async (id: string, notes?: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    await supabase.from('maintenance_tasks').update({ last_completed: now }).eq('id', id);
    await supabase.from('completion_history').insert({
      task_id: id,
      user_id: user.id,
      completed_at: now,
      notes: notes || null,
    });
    fetchTasks();
  };

  return { tasks, loading, addTask, updateTask, deleteTask, markCompleted };
}
