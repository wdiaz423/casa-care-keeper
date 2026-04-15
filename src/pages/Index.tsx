import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, LogOut, Bell, BellRing, Plus, Sparkles, BarChart3, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMaintenanceTasks } from '@/hooks/use-maintenance-tasks';
import { useHomes } from '@/hooks/use-homes';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/use-notifications';
import { toast } from 'sonner';

import { TaskCard } from '@/components/TaskCard';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { StatsCards } from '@/components/StatsCards';
import { RemindersBar } from '@/components/RemindersBar';
import { HomeSelector } from '@/components/HomeSelector';
import { HomeMembersDialog } from '@/components/HomeMembersDialog';
import { CATEGORIES, type MaintenanceCategory } from '@/lib/types';
import { getTaskStatus, getNextDueDate } from '@/lib/maintenance-utils';
import { Button } from '@/components/ui/button';
import type { TaskStatus } from '@/lib/types';

type FilterType = 'all' | TaskStatus;

const Index = () => {
  const navigate = useNavigate();
  const { homes, selectedHomeId, selectHome, addHome, updateHome, deleteHome, loading: homesLoading } = useHomes();
  const { tasks, loading, addTask, updateTask, markCompleted, deleteTask } = useMaintenanceTasks(selectedHomeId);
  const { user, signOut } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<MaintenanceCategory | 'all'>('all');
  const { requestPermission } = useNotifications(tasks);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => 'Notification' in window && Notification.permission === 'granted'
  );

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      toast.info('Las notificaciones están activas.');
      return;
    }
    const granted = await requestPermission();
    if (granted) {
      setNotificationsEnabled(true);
      toast.success('¡Notificaciones activadas!');
    } else {
      toast.error('Permiso denegado. Actívalas desde la configuración del navegador.');
    }
  };

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

  const selectedHome = homes.find(h => h.id === selectedHomeId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="h-10 w-10 rounded-xl flex items-center justify-center glow-primary icon-animated cursor-pointer"
              style={{ backgroundColor: selectedHome?.color || 'hsl(var(--primary))' }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="h-5 w-5 text-white" />
            </motion.div>
            <HomeSelector
              homes={homes}
              selectedHomeId={selectedHomeId}
              onSelect={selectHome}
              onAdd={addHome}
              onUpdate={updateHome}
              onDelete={deleteHome}
            />
          </div>
          <div className="flex items-center gap-1">
            <HomeMembersDialog homeId={selectedHomeId} homeName={selectedHome?.name || 'Hogar'} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              title="Dashboard"
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <BarChart3 className="h-4 w-4 icon-bounce" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              title="Configuración"
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4 icon-spin-hover" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleNotifications}
              title={notificationsEnabled ? 'Notificaciones activas' : 'Activar notificaciones'}
              className={`h-9 w-9 rounded-lg ${notificationsEnabled ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {notificationsEnabled ? <BellRing className="h-4 w-4 icon-wiggle" /> : <Bell className="h-4 w-4 icon-bounce" />}
            </Button>
            <AddTaskDialog onAdd={addTask} />
            <Button variant="ghost" size="icon" onClick={signOut} title="Cerrar sesión" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {loading || homesLoading ? (
          <div className="text-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              <Sparkles className="h-8 w-8 text-primary" />
            </motion.div>
            <p className="text-muted-foreground mt-3 font-body">Cargando...</p>
          </div>
        ) : homes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 space-y-4"
          >
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-heading text-foreground">¡Bienvenido!</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Comienza agregando tu primer hogar para llevar el control de mantenimiento.
            </p>
            <Button onClick={() => addHome({ name: 'Mi Casa', color: '#E97B2C', icon: 'home' })} className="gap-2 mt-2">
              <Plus className="h-4 w-4" />
              Agregar mi primer hogar
            </Button>
          </motion.div>
        ) : (
        <>
          <StatsCards tasks={tasks} />
          <RemindersBar tasks={tasks} />

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-1.5 flex-wrap">
              {filterButtons.map(btn => (
                <Button
                  key={btn.value}
                  variant={filter === btn.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(btn.value)}
                  className={`text-xs rounded-lg transition-all duration-200 ${filter === btn.value ? 'shadow-md shadow-primary/20' : ''}`}
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
                className="text-xs border border-border/50 rounded-lg px-3 py-1.5 bg-card/80 text-card-foreground backdrop-blur-sm"
              >
                <option value="all">Todas las categorías</option>
                {Object.entries(CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.emoji} {val.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Task list */}
          <AnimatePresence mode="wait">
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16 text-muted-foreground"
                >
                  <p className="text-lg font-heading">No hay tareas</p>
                  <p className="text-sm mt-1">Agrega una nueva tarea de mantenimiento</p>
                </motion.div>
              ) : (
                filteredTasks.map((task, i) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={markCompleted}
                    onDelete={deleteTask}
                    onUpdate={updateTask}
                    index={i}
                  />
                ))
              )}
            </div>
          </AnimatePresence>
        </>
        )}
      </main>
    </div>
  );
};

export default Index;
