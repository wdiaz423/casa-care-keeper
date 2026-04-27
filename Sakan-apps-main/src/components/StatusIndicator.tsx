import type { TaskStatus } from '@/lib/types';

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string; dotClass: string }> = {
  'on-track': { label: 'Al día', className: 'bg-success/10 text-success border border-success/20', dotClass: 'bg-success' },
  'due-soon': { label: 'Próximo', className: 'bg-warning/10 text-warning border border-warning/20', dotClass: 'bg-warning' },
  'overdue': { label: 'Vencido', className: 'bg-destructive/10 text-destructive border border-destructive/20', dotClass: 'bg-destructive animate-pulse-soft' },
};

export function StatusIndicator({ status }: { status: TaskStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  );
}
