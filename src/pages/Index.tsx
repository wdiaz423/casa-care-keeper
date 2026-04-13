import { useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Filter } from 'lucide-react';
import { useMaintenanceTasks } from '@/hooks/use-maintenance-tasks';

import { TaskCard } from '@/components/TaskCard';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { StatsCards } from '@/components/StatsCards';
import { CATEGORIES, type MaintenanceCategory } from '@/lib/types';
import { getTaskStatus, getNextDueDate } from '@/lib/maintenance-utils';
import { Button } from '@/components/ui/button';
import type { TaskStatus } from '@/lib/types';

type FilterType = 'all' | TaskStatus;

const Index = () => {
  const { tasks, addTask, markCompleted, deleteTask } = useMaintenanceTasks();
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<MaintenanceCategory | 'all'>('all');

  const filteredTasks = tasks
    .filter(t => filter === 'all' || getTaskStatus(t) === filter)
    .filter(t => categoryFilter === 'all' || t.category === categoryFilter)
    .sort((a, b) => getNextDueDate(a).getTime() - getNextDueDate(b).getTime());

  const filterButtons: { label: string; value: FilterType }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Vencidos', value: 'overdue' },
    { label: 'Próximos', value: 'due-soon' },
    { label: 'Al día', value: 'on-track' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-heading text-foreground">Mi Hogar</h1>
              <p className="text-xs text-muted-foreground">Control de mantenimiento</p>
            </div>
          </div>
          <AddTaskDialog onAdd={addTask} />
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <StatsCards tasks={tasks} />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {filterButtons.map(btn => (
              <Button
                key={btn.value}
                variant={filter === btn.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(btn.value)}
                className="text-xs"
              >
                {btn.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as MaintenanceCategory | 'all')}
              className="text-xs border rounded-md px-2 py-1.5 bg-card text-card-foreground"
            >
              <option value="all">Todas las categorías</option>
              {Object.entries(CATEGORIES).map(([key, val]) => (
                <option key={key} value={key}>{val.emoji} {val.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-muted-foreground"
            >
              <p className="text-lg font-heading">No hay tareas</p>
              <p className="text-sm mt-1">Agrega una nueva tarea de mantenimiento para comenzar</p>
            </motion.div>
          ) : (
            filteredTasks.map((task, i) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={markCompleted}
                onDelete={deleteTask}
                index={i}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
