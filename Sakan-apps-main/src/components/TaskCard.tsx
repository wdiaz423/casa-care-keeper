import { forwardRef } from 'react';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, Trash2, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { CategoryBadge } from './CategoryBadge';
import { StatusIndicator } from './StatusIndicator';
import { EditTaskDialog } from './EditTaskDialog';
import { TaskHistoryDialog } from './TaskHistoryDialog';
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

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
  ({ task, onComplete, onDelete, onUpdate, index }, ref) => {
  const status = getTaskStatus(task);
  const nextDue = getNextDueDate(task);
  const daysLeft = getDaysUntilDue(task);

  const isValidDate = nextDue instanceof Date && isValid(nextDue);

  const borderColor = status === 'overdue' 
    ? 'border-l-destructive' 
    : status === 'due-soon' 
    ? 'border-l-warning' 
    : 'border-l-success';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -2 }}
      className={`group rounded-xl border border-l-[3px] ${borderColor} bg-card/80 backdrop-blur-sm p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <CategoryBadge category={task.category} />
            <StatusIndicator status={status} />
          </div>
          <h3 className="font-body font-semibold text-card-foreground truncate text-[15px]">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 icon-bounce" />
             {isValidDate
                ? format(nextDue, "d 'de' MMM yyyy", { locale: es }) 
                : "Fecha no definida"}
            </span>
            <span className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              Cada {task.frequencyValue} {FREQUENCY_LABELS[task.frequencyUnit]}
            </span>
          </div>
          {status === 'overdue' && (
            <p className="text-xs text-destructive font-medium mt-2 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse-soft" />
              Vencido hace {Math.abs(daysLeft)} días
            </p>
          )}
          {status === 'due-soon' && daysLeft >= 0 && (
            <p className="text-xs text-warning font-medium mt-2 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse-soft" />
              Faltan {daysLeft} días
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
          <TaskHistoryDialog task={task} />
          <EditTaskDialog task={task} onSave={onUpdate} />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-success hover:bg-success/10 hover:text-success icon-bounce"
            onClick={() => onComplete(task.id)}
            title="Marcar completado"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive icon-wiggle"
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
);

TaskCard.displayName = 'TaskCard';