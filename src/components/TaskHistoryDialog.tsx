import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { History, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CategoryBadge } from './CategoryBadge';
import type { MaintenanceTask } from '@/lib/types';

interface TaskHistoryDialogProps {
  task: MaintenanceTask;
}

export function TaskHistoryDialog({ task }: TaskHistoryDialogProps) {
  const history = task.completionHistory || [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-muted hover:text-foreground" title="Historial">
          <History className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Historial de mantenimiento</DialogTitle>
        </DialogHeader>
        <div className="mb-3">
          <p className="font-medium text-foreground">{task.title}</p>
          <CategoryBadge category={task.category} />
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Aún no hay registros de mantenimiento completado.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-0">
            <div className="relative pl-6 space-y-4">
              {/* Timeline line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
              {history.map((record, i) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative"
                >
                  {/* Timeline dot */}
                  <div className={`absolute -left-6 top-1 h-[11px] w-[11px] rounded-full border-2 ${
                    i === 0 ? 'bg-success border-success' : 'bg-card border-muted-foreground/30'
                  }`} />
                  <div className="rounded-md border bg-card p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-card-foreground">
                        {format(new Date(record.date), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-5">
                      {format(new Date(record.date), "HH:mm", { locale: es })} hrs
                    </p>
                    {record.notes && (
                      <p className="text-xs text-muted-foreground mt-1.5 ml-5 italic">
                        {record.notes}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center mt-2">
          {history.length} {history.length === 1 ? 'registro' : 'registros'} en total
        </p>
      </DialogContent>
    </Dialog>
  );
}
