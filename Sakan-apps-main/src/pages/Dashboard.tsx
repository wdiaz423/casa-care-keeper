import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, PieChart, ArrowLeft, TrendingUp, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client'; 
import { useAuth } from '@/contexts/AuthContext';
import { useHomes } from '@/hooks/use-homes'; // Importante para filtrar por hogar
import { CATEGORIES, type MaintenanceCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart as RechartsPie, Pie, Cell } from 'recharts';

interface CompletionRow {
  completedAt: string; // CamelCase para tu nuevo backend
  taskId: string;
  category: string;
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(230, 60%, 60%)',
  'hsl(340, 65%, 55%)',
  'hsl(45, 85%, 55%)',
  'hsl(280, 50%, 55%)',
  'hsl(190, 60%, 45%)',
];

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedHomeId } = useHomes();
  const navigate = useNavigate();
  const [completions, setCompletions] = useState<CompletionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !selectedHomeId) return;

    async function loadDashboardData() {
      setLoading(true);
      try {
        // En una arquitectura limpia, el backend debería devolvernos 
        // ya el historial procesado para este hogar específico.
        const data = await api.get(`/api/homes/${selectedHomeId}/activity`);
        
        // Mapeamos para normalizar nombres de campos si es necesario
        const mapped = data.map((item: any) => ({
          completedAt: item.completedAt || item.completed_at,
          taskId: item.taskId || item.task_id,
          category: item.task?.category || item.taskCategory || 'general'
        }));

        setCompletions(mapped);
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user, selectedHomeId]);

  // Datos Mensuales (Últimos 12 meses)
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months: any[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ 
        name: MONTHS_ES[d.getMonth()], 
        completions: 0, 
        month: d.getMonth(), 
        year: d.getFullYear() 
      });
    }

    completions.forEach(c => {
      const d = new Date(c.completedAt);
      const entry = months.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
      if (entry) entry.completions++;
    });
    return months;
  }, [completions]);

  // Datos por Categoría
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    completions.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([cat, value], i) => ({
        name: CATEGORIES[cat as MaintenanceCategory]?.label || cat,
        emoji: CATEGORIES[cat as MaintenanceCategory]?.emoji || '🔧',
        value,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [completions]);

  const totalCompletions = completions.length;
  const thisMonth = monthlyData[monthlyData.length - 1]?.completions || 0;
  const lastMonth = monthlyData[monthlyData.length - 2]?.completions || 0;
  const trend = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : thisMonth > 0 ? 100 : 0;

  const barChartConfig: ChartConfig = {
    completions: { label: 'Completados', color: 'hsl(var(--primary))' },
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
            <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-heading text-foreground">Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Analizando datos...</p>
          </div>
        ) : (
          <>
            {/* Resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Total completados', value: totalCompletions, icon: Calendar, color: 'text-primary' },
                { label: 'Este mes', value: thisMonth, icon: BarChart3, color: 'text-accent' },
                { label: 'Tendencia', value: `${trend >= 0 ? '+' : ''}${trend}%`, icon: TrendingUp, color: trend >= 0 ? 'text-green-500' : 'text-red-500' },
              ].map((card, i) => (
                <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="border-border/50 bg-card/50">
                    <CardContent className="pt-5 pb-4 px-5 flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl bg-background border border-border flex items-center justify-center ${card.color}`}>
                        <card.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{card.label}</p>
                        <p className="text-2xl font-heading font-bold">{card.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Actividad Mensual</CardTitle>
                </CardHeader>
                <CardContent>
                  {totalCompletions === 0 ? (
                    <EmptyState />
                  ) : (
                    <ChartContainer config={barChartConfig} className="h-[250px] w-full">
                      <BarChart data={monthlyData}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-10" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11 }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="completions" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Distribución por Categoría</CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryData.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <ChartContainer config={pieChartConfig} className="h-[200px] w-full sm:w-[200px]">
                        <RechartsPie>
                          <Pie 
                            data={categoryData} 
                            dataKey="value" 
                            nameKey="name" 
                            innerRadius={60} 
                            outerRadius={80} 
                            strokeWidth={5}
                            stroke="hsl(var(--card))"
                          >
                            {categoryData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </RechartsPie>
                      </ChartContainer>
                      <div className="flex-1 space-y-2 w-full">
                        {categoryData.map((d) => (
                          <div key={d.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} />
                              <span className="text-muted-foreground">{d.emoji} {d.name}</span>
                            </div>
                            <span className="font-bold">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border/50 rounded-xl">
      Aún no hay datos disponibles
    </div>
  );
}