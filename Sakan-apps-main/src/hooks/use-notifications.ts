import { useEffect, useCallback, useRef } from 'react';
import type { MaintenanceTask } from '@/lib/types';
import { getTaskStatus, getDaysUntilDue } from '@/lib/maintenance-utils';

export function useNotifications(tasks: MaintenanceTask[]) {
  const permissionRef = useRef<NotificationPermission>('default');
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ('Notification' in window) {
      permissionRef.current = Notification.permission;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    permissionRef.current = result;
    return result === 'granted';
  }, []);

  const checkAndNotify = useCallback(() => {
    if (permissionRef.current !== 'granted' || tasks.length === 0) return;

    const sessionKey = `notified-${new Date().toDateString()}`;
    const alreadyNotified = new Set(
      JSON.parse(sessionStorage.getItem(sessionKey) || '[]') as string[]
    );

    const urgent = tasks.filter(t => {
      const status = getTaskStatus(t);
      return (status === 'overdue' || status === 'due-soon') && !alreadyNotified.has(t.id);
    });

    if (urgent.length === 0) return;

    const overdue = urgent.filter(t => getTaskStatus(t) === 'overdue');
    const dueSoon = urgent.filter(t => getTaskStatus(t) === 'due-soon');

    let body = '';
    if (overdue.length > 0) {
      body += `⚠️ ${overdue.length} tarea(s) vencida(s): ${overdue.map(t => t.title).slice(0, 3).join(', ')}`;
      if (overdue.length > 3) body += `… y ${overdue.length - 3} más`;
    }
    if (dueSoon.length > 0) {
      if (body) body += '\n';
      body += `📅 ${dueSoon.length} tarea(s) próxima(s): ${dueSoon.map(t => {
        const days = getDaysUntilDue(t);
        return `${t.title} (${days}d)`;
      }).slice(0, 3).join(', ')}`;
    }

    try {
      new Notification('🏠 Mi Hogar — Recordatorio', {
        body,
        icon: '/placeholder.svg',
        tag: 'maintenance-reminder',
        requireInteraction: true,
      });
    } catch {
      // Notification constructor may fail in some contexts
    }

    urgent.forEach(t => alreadyNotified.add(t.id));
    sessionStorage.setItem(sessionKey, JSON.stringify([...alreadyNotified]));
  }, [tasks]);

  // Check on mount & tasks change
  useEffect(() => {
    if (tasks.length > 0 && permissionRef.current === 'granted') {
      const timer = setTimeout(checkAndNotify, 2000);
      return () => clearTimeout(timer);
    }
  }, [tasks, checkAndNotify]);

  // Periodic check every 30 min
  useEffect(() => {
    if (permissionRef.current !== 'granted') return;
    const interval = setInterval(checkAndNotify, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAndNotify]);

  return { requestPermission, checkAndNotify };
}
