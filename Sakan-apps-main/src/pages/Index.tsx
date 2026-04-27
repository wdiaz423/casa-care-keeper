import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, LogOut, Bell, BellRing, Plus, Sparkles, BarChart3, Settings, Activity as ActivityIcon } from 'lucide-react';
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
import { HomeMembersAvatars } from '@/components/HomeMembersAvatars';
import { CATEGORIES, type MaintenanceCategory, type TaskStatus } from '@/lib/types';
import { getTaskStatus, getNextDueDate } from '@/lib/maintenance-utils';
import { Button } from '@/components/ui/button';

type FilterType = 'all' | TaskStatus;

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  // Estos hooks ahora manejan la lógica de tu API propia
  const { homes, selectedHomeId, selectHome, addHome, updateHome, deleteHome, loading: homesLoading } = useHomes();
  const { tasks, loading: tasksLoading, addTask, updateTask, markCompleted, deleteTask } = useMaintenanceTasks(selectedHomeId);
  
  const [filter, setFilter] = useState<FilterType>('all');
  const [categoryFilter, setCategoryFilter] = useState<MaintenanceCategory | 'all'>('all');
  const { requestPermission } = useNotifications(tasks);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      toast.info('Las notificaciones ya están activas.');
      return;
    }
    const granted = await requestPermission();
    if (granted) {
      setNotificationsEnabled(true);
      toast.success('¡Notificaciones activadas!');
    } else {
      toast.error('Permiso denegado. Actívalas en la configuración del navegador.');
    }
  };

  // Filtrado de tareas local para mejorar la velocidad de respuesta (Optimistic UI)
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
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg cursor-pointer"
              style={{ backgroundColor: selectedHome?.color || 'hsl(var(--primary))' }}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
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

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="hidden sm:flex items-center gap-1 mr-2">
               <HomeMembersAvatars homeId={selectedHomeId} />
               <HomeMembersDialog homeId={selectedHomeId} homeName={selectedHome?.name || 'Hogar'} />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              title="Estadísticas"
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/activity')}
              title="Historial de actividad"
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-primary"
            >
              <ActivityIcon className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleNotifications}
              className={`h-9 w-9 rounded-lg ${notificationsEnabled ? 'text-primary' : 'text-muted-foreground'}`}
            >
              {notificationsEnabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </Button>

            <AddTaskDialog onAdd={addTask} />

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={signOut} 
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {tasksLoading || homesLoading ? (
          <div className="text-center py-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              <Sparkles className="h-10 w-10 text-primary opacity-50" />
            </motion.div>
            <p className="text-muted-foreground mt-4 text-sm animate-pulse">Sincronizando con tu hogar...</p>
          </div>
        ) : homes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-card/30 border border-dashed border-border rounded-3xl space-y-5"
          >
            <div className="mx-auto h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center">
              <Plus className="h-10 w-10 text-primary/40" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-heading text-foreground font-bold">¡Hola, {user?.name?.split(' ')[0]}!</h2>
              <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                Aún no tienes ningún hogar configurado. Crea uno para empezar a organizar tus tareas.
              </p>
            </div>
            <Button onClick={() => addHome({ name: 'Mi Hogar', color: '#E97B2C', icon: 'home' })} className="rounded-xl px-8 shadow-lg shadow-primary/20">
              Crear mi primer hogar
            </Button>
          </motion.div>
        ) : (
        <>
          <StatsCards tasks={tasks} />
          <RemindersBar tasks={tasks} />

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-4">
            <div className="flex gap-2 flex-wrap">
              {filterButtons.map(btn => (
                <Button
                  key={btn.value}
                  variant={filter === btn.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(btn.value)}
                  className="text-xs rounded-full h-8 px-4"
                >
                  {btn.label}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value as MaintenanceCategory | 'all')}
                className="text-xs border border-border/50 rounded-full px-4 py-2 bg-card hover:bg-accent transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-auto"
              >
                <option value="all">Todas las categorías</option>
                {Object.entries(CATEGORIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.emoji} {val.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 pb-20">
            <AnimatePresence mode="popLayout">
              {filteredTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 text-muted-foreground bg-accent/20 rounded-2xl border border-border/50"
                >
                  <p className="font-medium">No hay tareas que coincidan</p>
                  <p className="text-xs">Prueba cambiando los filtros</p>
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
            </AnimatePresence>
          </div>
        </>
        )}
      </main>
    </div>
  );
};

export default Index;