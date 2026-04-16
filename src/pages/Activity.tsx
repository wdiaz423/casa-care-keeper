import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Activity as ActivityIcon, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useHomes } from '@/hooks/use-homes';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CategoryBadge } from '@/components/CategoryBadge';
import { CATEGORIES, type MaintenanceCategory } from '@/lib/types';

interface ActivityItem {
  id: string;
  completed_at: string;
  notes: string | null;
  user_id: string;
  task_id: string;
  task_title: string;
  task_category: MaintenanceCategory;
  display_name: string;
  avatar_url: string | null;
}

export default function Activity() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { homes, selectedHomeId } = useHomes();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedHome = useMemo(() => homes.find(h => h.id === selectedHomeId), [homes, selectedHomeId]);

  useEffect(() => {
    const load = async () => {
      if (!user || !selectedHomeId) { setItems([]); setLoading(false); return; }
      setLoading(true);

      const { data: tasks } = await supabase
        .from('maintenance_tasks')
        .select('id, title, category')
        .eq('home_id', selectedHomeId);

      const taskIds = (tasks || []).map(t => t.id);
      if (taskIds.length === 0) { setItems([]); setLoading(false); return; }

      const { data: history } = await supabase
        .from('completion_history')
        .select('id, completed_at, notes, user_id, task_id')
        .in('task_id', taskIds)
        .order('completed_at', { ascending: false })
        .limit(200);

      const userIds = Array.from(new Set((history || []).map(h => h.user_id)));
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds)
        : { data: [] as { user_id: string; display_name: string | null; avatar_url: string | null }[] };

      const taskMap = new Map((tasks || []).map(t => [t.id, t]));
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      const mapped: ActivityItem[] = (history || []).map(h => {
        const t = taskMap.get(h.task_id);
        const p = profileMap.get(h.user_id);
        return {
          id: h.id,
          completed_at: h.completed_at,
          notes: h.notes,
          user_id: h.user_id,
          task_id: h.task_id,
          task_title: t?.title || 'Tarea eliminada',
          task_category: (t?.category as MaintenanceCategory) || 'general',
          display_name: p?.display_name || 'Usuario',
          avatar_url: p?.avatar_url || null,
        };
      });

      setItems(mapped);
      setLoading(false);
    };
    load();
  }, [user, selectedHomeId]);

  const grouped = useMemo(() => {
    const map = new Map<string, ActivityItem[]>();
    items.forEach(it => {
      const key = format(new Date(it.completed_at), "EEEE d 'de' MMMM, yyyy", { locale: es });
      const arr = map.get(key) || [];
      arr.push(it);
      map.set(key, arr);
    });
    return Array.from(map.entries());
  }, [items]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="container max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-9 w-9 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center"
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

      <main className="container max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <p className="text-center text-muted-foreground py-20">Cargando actividad...</p>
        ) : items.length === 0 ? (
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
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3 capitalize">
                  {day}
                </h2>
                <div className="space-y-2">
                  {dayItems.map((it, i) => {
                    const cat = CATEGORIES[it.task_category];
                    const initials = it.display_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                    return (
                      <motion.div
                        key={it.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex gap-3 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 hover:shadow-lg hover:shadow-primary/5 transition-all"
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          {it.avatar_url && <AvatarImage src={it.avatar_url} alt={it.display_name} />}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {initials || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-card-foreground">
                            <span className="font-semibold">{it.display_name}</span>
                            <span className="text-muted-foreground"> completó </span>
                            <span className="font-medium">{it.task_title}</span>
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <CategoryBadge category={it.task_category} />
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(it.completed_at), 'HH:mm')} · hace{' '}
                              {formatDistanceToNow(new Date(it.completed_at), { locale: es })}
                            </span>
                          </div>
                          {it.notes && (
                            <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-border pl-2">
                              "{it.notes}"
                            </p>
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
