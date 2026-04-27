import { useState, useEffect, useCallback } from 'react';
import api from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import type { MaintenanceTask, CompletionRecord } from '@/lib/types';

export function useMaintenanceTasks(homeId?: string | null) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/tasks');
      let items = Array.isArray(data) ? data : [];
      if (homeId) items = items.filter((t: any) => String(t.home?.id || t.homeId) === String(homeId));
      const mapped: MaintenanceTask[] = items.map((t: any) => ({
        id: String(t.id),
        title: t.title,
        category: 'maintenance' as MaintenanceTask['category'],
        description: t.description || undefined,
        frequencyValue: 0,
        frequencyUnit: 'days',
        lastCompleted: undefined,
        completionHistory: [] as CompletionRecord[],
        notes: undefined,
        homeId: t.home?.id ? String(t.home.id) : (t.homeId ? String(t.homeId) : undefined),
      }));
      setTasks(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, homeId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (task: MaintenanceTask) => {
    try {
      await api.post('/api/tasks', { title: task.title, description: task.description, homeId: task.homeId || homeId });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const updateTask = async (id: string, updates: Partial<MaintenanceTask>) => {
    try {
      await api.put(`/api/tasks/${id}`, { title: updates.title, description: updates.description });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await api.delete(`/api/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const markCompleted = async (id: string, notes?: string) => {
    try {
      await api.put(`/api/tasks/${id}`, { status: 'done' });
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return { tasks, loading, addTask, updateTask, deleteTask, markCompleted };
}
