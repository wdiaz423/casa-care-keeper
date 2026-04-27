import { addDays, addWeeks, addMonths, addYears, differenceInDays, isPast, isBefore, addDays as addD } from 'date-fns';
import type { MaintenanceTask, TaskStatus } from './types';

export function getNextDueDate(task: MaintenanceTask): Date {
  const last = new Date(task.lastCompleted);
  switch (task.frequencyUnit) {
    case 'days': return addDays(last, task.frequencyValue);
    case 'weeks': return addWeeks(last, task.frequencyValue);
    case 'months': return addMonths(last, task.frequencyValue);
    case 'years': return addYears(last, task.frequencyValue);
  }
}

export function getTaskStatus(task: MaintenanceTask): TaskStatus {
  const nextDue = getNextDueDate(task);
  const now = new Date();
  if (isPast(nextDue)) return 'overdue';
  if (isBefore(nextDue, addDays(now, 7))) return 'due-soon';
  return 'on-track';
}

export function getDaysUntilDue(task: MaintenanceTask): number {
  const nextDue = getNextDueDate(task);
  return differenceInDays(nextDue, new Date());
}

export function generateId(): string {
  return crypto.randomUUID();
}
