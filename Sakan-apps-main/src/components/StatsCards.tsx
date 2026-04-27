import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Clock, ListChecks } from 'lucide-react';
import type { MaintenanceTask } from '@/lib/types';
import { getTaskStatus } from '@/lib/maintenance-utils';

interface StatsCardsProps {
  tasks: MaintenanceTask[];
}

export function StatsCards({ tasks }: StatsCardsProps) {
  const overdue = tasks.filter(t => getTaskStatus(t) === 'overdue').length;
  const dueSoon = tasks.filter(t => getTaskStatus(t) === 'due-soon').length;
  const onTrack = tasks.filter(t => getTaskStatus(t) === 'on-track').length;

  const stats = [
    { label: 'Total', value: tasks.length, icon: ListChecks, color: 'text-primary', bg: 'bg-primary/10', glow: 'group-hover:shadow-[0_0_15px_-3px_hsl(var(--primary)/0.3)]' },
    { label: 'Al día', value: onTrack, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', glow: 'group-hover:shadow-[0_0_15px_-3px_hsl(var(--success)/0.3)]' },
    { label: 'Próximos', value: dueSoon, icon: Clock, color: 'text-warning', bg: 'bg-warning/10', glow: 'group-hover:shadow-[0_0_15px_-3px_hsl(var(--warning)/0.3)]' },
    { label: 'Vencidos', value: overdue, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', glow: 'group-hover:shadow-[0_0_15px_-3px_hsl(var(--destructive)/0.3)]' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`group rounded-xl border bg-card/80 backdrop-blur-sm p-4 transition-all duration-300 hover:-translate-y-0.5 ${stat.glow}`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`h-4 w-4 ${stat.color} icon-animated`} />
            </div>
            <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{stat.label}</span>
          </div>
          <p className="text-3xl font-heading text-card-foreground tracking-tight">{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
