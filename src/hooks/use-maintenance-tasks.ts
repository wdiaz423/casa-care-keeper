import { useState, useEffect } from 'react';
import type { MaintenanceTask } from '@/lib/types';
import { generateId } from '@/lib/maintenance-utils';

const STORAGE_KEY = 'home-maintenance-tasks';

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

const SAMPLE_TASKS: MaintenanceTask[] = [
  {
    id: '1',
    title: 'Revisar filtros del aire acondicionado',
    category: 'hvac',
    description: 'Limpiar o reemplazar filtros',
    frequencyValue: 3,
    frequencyUnit: 'months',
    lastCompleted: new Date(now - 80 * day).toISOString(),
    completionHistory: [
      { id: 'h1a', date: new Date(now - 80 * day).toISOString() },
      { id: 'h1b', date: new Date(now - 170 * day).toISOString() },
    ],
  },
  {
    id: '2',
    title: 'Limpiar canaletas',
    category: 'exterior',
    description: 'Remover hojas y residuos de las canaletas',
    frequencyValue: 6,
    frequencyUnit: 'months',
    lastCompleted: new Date(now - 200 * day).toISOString(),
    completionHistory: [
      { id: 'h2a', date: new Date(now - 200 * day).toISOString() },
    ],
  },
  {
    id: '3',
    title: 'Podar el jardín',
    category: 'garden',
    frequencyValue: 2,
    frequencyUnit: 'weeks',
    lastCompleted: new Date(now - 10 * day).toISOString(),
    completionHistory: [
      { id: 'h3a', date: new Date(now - 10 * day).toISOString() },
      { id: 'h3b', date: new Date(now - 24 * day).toISOString() },
      { id: 'h3c', date: new Date(now - 38 * day).toISOString() },
    ],
  },
  {
    id: '4',
    title: 'Revisar detectores de humo',
    category: 'electrical',
    description: 'Probar baterías y funcionamiento',
    frequencyValue: 6,
    frequencyUnit: 'months',
    lastCompleted: new Date(now - 30 * day).toISOString(),
    completionHistory: [
      { id: 'h4a', date: new Date(now - 30 * day).toISOString() },
    ],
  },
  {
    id: '5',
    title: 'Limpieza profunda de cocina',
    category: 'cleaning',
    description: 'Electrodomésticos, azulejos y campana',
    frequencyValue: 1,
    frequencyUnit: 'months',
    lastCompleted: new Date(now - 35 * day).toISOString(),
    completionHistory: [
      { id: 'h5a', date: new Date(now - 35 * day).toISOString() },
      { id: 'h5b', date: new Date(now - 65 * day).toISOString() },
    ],
  },
];

export function useMaintenanceTasks() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // Migrate old tasks without completionHistory
        const parsed: MaintenanceTask[] = JSON.parse(stored);
        return parsed.map(t => ({
          ...t,
          completionHistory: t.completionHistory || [],
        }));
      }
      return SAMPLE_TASKS;
    } catch {
      return SAMPLE_TASKS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (task: MaintenanceTask) => setTasks(prev => [task, ...prev]);
  
  const updateTask = (id: string, updates: Partial<MaintenanceTask>) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

  const deleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const markCompleted = (id: string, notes?: string) => {
    const now = new Date().toISOString();
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      return {
        ...t,
        lastCompleted: now,
        completionHistory: [
          { id: generateId(), date: now, notes },
          ...t.completionHistory,
        ],
      };
    }));
  };

  return { tasks, addTask, updateTask, deleteTask, markCompleted };
}
