import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, Trash2, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { CategoryBadge } from './CategoryBadge';
import { StatusIndicator } from './StatusIndicator';
import { EditTaskDialog } from './EditTaskDialog';
import { Button } from '@/components/ui/button';
import { getTaskStatus, getNextDueDate, getDaysUntilDue } from '@/lib/maintenance-utils';
import { FREQUENCY_LABELS } from '@/lib/types';
import type { MaintenanceTask } from '@/lib/types';

interface TaskCardProps {
  task: MaintenanceTask;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<MaintenanceTask>) => void;
  index: number;
}

export function TaskCard({ task, onComplete, onDelete, onUpdate, index }: TaskCardProps) {
  const status = getTaskStatus(task);
  const nextDue = getNextDueDate(task);
  const daysLeft = getDaysUntilDue(task);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <CategoryBadge category={task.category} />
            <StatusIndicator status={status} />
          </div>
          <h3 className="font-body font-semibold text-card-foreground truncate">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Próximo: {format(nextDue, "d MMM yyyy", { locale: es })}
            </span>
            <span>
              Cada {task.frequencyValue} {FREQUENCY_LABELS[task.frequencyUnit]}
            </span>
          </div>
          {status === 'overdue' && (
            <p className="text-xs text-destructive font-medium mt-1">
              Vencido hace {Math.abs(daysLeft)} días
            </p>
          )}
          {status === 'due-soon' && daysLeft >= 0 && (
            <p className="text-xs text-warning-foreground font-medium mt-1">
              Faltan {daysLeft} días
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <EditTaskDialog task={task} onSave={onUpdate} />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-success hover:bg-success/10 hover:text-success"
            onClick={() => onComplete(task.id)}
            title="Marcar completado"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(task.id)}
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
