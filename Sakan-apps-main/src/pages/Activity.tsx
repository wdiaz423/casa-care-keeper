import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity as ActivityIcon, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from "@/api/client"; 
import { useAuth } from '@/contexts/AuthContext';
import { useHomes } from '@/hooks/use-homes';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CategoryBadge } from '@/components/CategoryBadge';
import { CATEGORIES, type MaintenanceCategory } from '@/lib/types';

interface ActivityItem {
  id: string;
  completedAt: string; // CamelCase para seguir el estándar de tu nuevo Backend
  notes: string | null;
  userId: string;
  taskTitle: string;
  taskCategory: MaintenanceCategory;
  displayName: string;
  avatarUrl: string | null;
}

type TimeFilter = 'today' | '7d' | '30d' | '90d' | 'all';

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: '90d', label: '90 días' },
  { value: 'all', label: 'Todo' },
];

export default function Activity() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { homes, selectedHomeId } = useHomes();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30d');

  const selectedHome = useMemo(() => homes.find(h => h.id === selectedHomeId), [homes, selectedHomeId]);

  useEffect(() => {
    const loadActivity = async () => {
      if (!user || !selectedHomeId) { 
        setItems([]); 
        setLoading(false); 
        return; 
      }
      
      setLoading(true);
      try {
        // LLAMADA ÚNICA: Pedimos la actividad de la casa al backend
        // El backend debe encargarse de unir las tablas de tareas y usuarios
        const data = await api.get(`homes/${selectedHomeId}/activity`);
        
        // Mapeamos los datos para asegurar que coincidan con nuestra interfaz
        const mapped: ActivityItem[] = (data || []).map((item: any) => ({
          id: item.id,
          completedAt: item.completedAt || item.completed_at,
          notes: item.notes,
          userId: item.userId || item.user_id,
          taskTitle: item.task?.title || item.taskTitle || 'Tarea eliminada',
          taskCategory: (item.task?.category || item.taskCategory || 'general') as MaintenanceCategory,
          displayName: item.user?.name || item.displayName || 'Usuario',
          avatarUrl: item.user?.avatarUrl || item.avatarUrl || null,
        }));

        setItems(mapped);
      } catch (error) {
        console.error("Error cargando actividad:", error);
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, [user, selectedHomeId]);

  // Lógica de filtrado por tiempo (Se mantiene igual pero usamos completedAt)
  const filteredItems = useMemo(() => {
    if (timeFilter === 'all') return items;
    const now = Date.now();
    const ranges: Record<Exclude<TimeFilter, 'all'>, number> = {
      today: 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
    };
    
    if (timeFilter === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      return items.filter(it => new Date(it.completedAt).getTime() >= start.getTime());
    }
    
    const cutoff = now - ranges[timeFilter];
    return items.filter(it => new Date(it.completedAt).getTime() >= cutoff);
  }, [items, timeFilter]);

  // Agrupación por días para el diseño de la lista
  const grouped = useMemo(() => {
    const map = new Map<string, ActivityItem[]>();
    filteredItems.forEach(it => {
      const key = format(new Date(it.completedAt), "EEEE d 'de' MMMM, yyyy", { locale: es });
      const arr = map.get(key) || [];
      arr.push(it);
      map.set(key, arr);
    });
    return Array.from(map.entries());
  }, [filteredItems]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-9 w-9 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center shadow-inner"
              style={{ backgroundColor: selectedHome?.color || 'hsl(var(--primary))' }}
            >
              <ActivityIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-lg leading-tight">Actividad</h1>
              <p className="text-xs text-muted-foreground">{selectedHome?.name || 'Hogar'}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex gap-1.5 flex-wrap items-center">
          {TIME_FILTERS.map(f => (
            <Button
              key={f.value}
              variant={timeFilter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFilter(f.value)}
              className={`text-xs rounded-lg transition-all ${timeFilter === f.value ? 'shadow-md shadow-primary/30' : ''}`}
            >
              {f.label}
            </Button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground font-medium">
            {filteredItems.length} {filteredItems.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Cargando actividad...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <ActivityIcon className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-heading text-xl">Sin actividad aún</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Cuando los miembros completen tareas en este hogar, aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map(([day, dayItems]) => (
              <section key={day}>
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-4 capitalize">
                  {day}
                </h2>
                <div className="space-y-3">
                  {dayItems.map((it, i) => {
                    const initials = it.displayName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                    return (
                      <motion.div
                        key={it.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex gap-4 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 hover:shadow-lg hover:shadow-primary/5 transition-all"
                      >
                        <Avatar className="h-10 w-10 shrink-0 border border-border">
                          {it.avatarUrl && <AvatarImage src={it.avatarUrl} alt={it.displayName} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {initials || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-card-foreground leading-snug">
                            <span className="font-bold">{it.displayName}</span>
                            <span className="text-muted-foreground"> completó </span>
                            <span className="font-semibold text-primary/90">{it.taskTitle}</span>
                          </p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <CategoryBadge category={it.taskCategory} />
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                              <Clock className="h-3 w-3" />
                              {format(new Date(it.completedAt), 'HH:mm')} · hace{' '}
                              {formatDistanceToNow(new Date(it.completedAt), { locale: es })}
                            </span>
                          </div>
                          {it.notes && (
                            <div className="mt-3 p-2.5 rounded-lg bg-muted/30 border-l-2 border-primary/30">
                              <p className="text-xs text-muted-foreground italic leading-relaxed">
                                "{it.notes}"
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}