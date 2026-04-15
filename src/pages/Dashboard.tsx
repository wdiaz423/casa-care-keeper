import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, ArrowLeft, TrendingUp, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORIES, type MaintenanceCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart as RechartsPie, Pie, Cell, ResponsiveContainer } from 'recharts';

interface CompletionRow {
  completed_at: string;
  task_id: string;
  notes: string | null;
}

interface TaskRow {
  id: string;
  category: string;
  title: string;
}

const CHART_COLORS = [
  'hsl(25, 85%, 55%)',
  'hsl(165, 40%, 45%)',
  'hsl(230, 60%, 60%)',
  'hsl(340, 65%, 55%)',
  'hsl(45, 85%, 55%)',
  'hsl(280, 50%, 55%)',
  'hsl(190, 60%, 45%)',
  'hsl(0, 65%, 55%)',
  'hsl(120, 40%, 45%)',
];

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completions, setCompletions] = useState<CompletionRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      setLoading(true);
      const [{ data: c }, { data: t }] = await Promise.all([
        supabase.from('completion_history').select('completed_at, task_id, notes'),
        supabase.from('maintenance_tasks').select('id, category, title'),
      ]);
      setCompletions(c || []);
      setTasks(t || []);
      setLoading(false);
    }
    load();
  }, [user]);

  const taskMap = useMemo(() => {
    const m = new Map<string, TaskRow>();
    tasks.forEach(t => m.set(t.id, t));
    return m;
  }, [tasks]);

  // Monthly data (last 12 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: { name: string; completions: number; month: number; year: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ name: MONTHS_ES[d.getMonth()], completions: 0, month: d.getMonth(), year: d.getFullYear() });
    }
    completions.forEach(c => {
      const d = new Date(c.completed_at);
      const entry = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (entry) entry.completions++;
    });
    return months;
  }, [completions]);

  // Category data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    completions.forEach(c => {
      const task = taskMap.get(c.task_id);
      if (task) counts[task.category] = (counts[task.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([cat, value], i) => ({
        name: CATEGORIES[cat as MaintenanceCategory]?.label || cat,
        emoji: CATEGORIES[cat as MaintenanceCategory]?.emoji || '🔧',
        value,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [completions, taskMap]);

  const totalCompletions = completions.length;
  const thisMonth = monthlyData[monthlyData.length - 1]?.completions || 0;
  const lastMonth = monthlyData[monthlyData.length - 2]?.completions || 0;
  const trend = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : thisMonth > 0 ? 100 : 0;

  const barChartConfig: ChartConfig = {
    completions: { label: 'Completados', color: 'hsl(25, 85%, 55%)' },
  };

  const pieChartConfig: ChartConfig = Object.fromEntries(
    categoryData.map(d => [d.name, { label: d.name, color: d.fill }])
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/60 backdrop-blur-xl sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="h-9 w-9 rounded-lg">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <motion.div
              className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <BarChart3 className="h-5 w-5 text-primary" />
            </motion.div>
            <h1 className="text-xl font-heading text-foreground">Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Cargando datos...</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total completados', value: totalCompletions, icon: Calendar, color: 'text-primary' },
                { label: 'Este mes', value: thisMonth, icon: BarChart3, color: 'text-accent' },
                { label: 'Tendencia', value: `${trend >= 0 ? '+' : ''}${trend}%`, icon: TrendingUp, color: trend >= 0 ? 'text-success' : 'text-destructive' },
              ].map((card, i) => (
                <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="glass-card">
                    <CardContent className="pt-5 pb-4 px-5 flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl bg-card flex items-center justify-center ${card.color}`}>
                        <card.icon className="h-5 w-5 icon-animated" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        <p className="text-2xl font-heading font-bold">{card.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar chart - monthly */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-heading flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary icon-animated" />
                      Completados por mes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {totalCompletions === 0 ? (
                      <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                        Aún no hay datos. ¡Completa tu primera tarea!
                      </div>
                    ) : (
                      <ChartContainer config={barChartConfig} className="h-[250px] w-full">
                        <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="completions" radius={[6, 6, 0, 0]} fill="hsl(25, 85%, 55%)" />
                        </BarChart>
                      </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Pie chart - categories */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-heading flex items-center gap-2">
                      <PieChart className="h-4 w-4 text-accent icon-animated" />
                      Por categoría
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {categoryData.length === 0 ? (
                      <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                        Sin datos todavía
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <ChartContainer config={pieChartConfig} className="h-[250px] flex-1">
                          <RechartsPie>
                            <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={40}>
                              {categoryData.map((entry, i) => (
                                <Cell key={i} fill={entry.fill} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </RechartsPie>
                        </ChartContainer>
                        <div className="space-y-2 min-w-[120px]">
                          {categoryData.map((d) => (
                            <div key={d.name} className="flex items-center gap-2 text-xs">
                              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                              <span className="text-muted-foreground">{d.emoji} {d.name}</span>
                              <span className="ml-auto font-medium text-foreground">{d.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
