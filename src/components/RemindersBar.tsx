import { AlertTriangle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MaintenanceTask } from '@/lib/types';
import { getTaskStatus, getDaysUntilDue, getNextDueDate } from '@/lib/maintenance-utils';
import { CATEGORIES } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RemindersBarProps {
  tasks: MaintenanceTask[];
}

export function RemindersBar({ tasks }: RemindersBarProps) {
  const overdueTasks = tasks
    .filter(t => getTaskStatus(t) === 'overdue')
    .sort((a, b) => getDaysUntilDue(a) - getDaysUntilDue(b));

  const dueSoonTasks = tasks
    .filter(t => getTaskStatus(t) === 'due-soon')
    .sort((a, b) => getDaysUntilDue(a) - getDaysUntilDue(b));

  if (overdueTasks.length === 0 && dueSoonTasks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {overdueTasks.length > 0 && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-destructive/15 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-destructive icon-wiggle" />
            </div>
            <h3 className="text-sm font-semibold text-destructive">
              {overdueTasks.length} {overdueTasks.length === 1 ? 'tarea vencida' : 'tareas vencidas'}
            </h3>
          </div>
          <div className="space-y-2">
            {overdueTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{CATEGORIES[task.category].emoji}</span>
                  <span className="truncate text-foreground font-medium">{task.title}</span>
                </div>
                <span className="text-destructive text-xs font-medium whitespace-nowrap">
                  hace {Math.abs(getDaysUntilDue(task))} días
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dueSoonTasks.length > 0 && (
        <div className="rounded-xl border border-warning/20 bg-warning/5 backdrop-blur-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-warning/15 flex items-center justify-center">
              <Clock className="h-4 w-4 text-warning icon-bounce" />
            </div>
            <h3 className="text-sm font-semibold text-warning">
              {dueSoonTasks.length} {dueSoonTasks.length === 1 ? 'tarea próxima' : 'tareas próximas'}
            </h3>
          </div>
          <div className="space-y-2">
            {dueSoonTasks.map(task => {
              const days = getDaysUntilDue(task);
              const nextDue = getNextDueDate(task);
              return (
                <div key={task.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">{CATEGORIES[task.category].emoji}</span>
                    <span className="truncate text-foreground font-medium">{task.title}</span>
                  </div>
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : `en ${days} días`}
                    {' · '}
                    {format(nextDue, "d MMM", { locale: es })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
