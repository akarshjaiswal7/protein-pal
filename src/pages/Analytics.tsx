import { useMemo } from 'react';
import { BarChart3, TrendingUp, Target, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import AppNavbar from '@/components/AppNavbar';
import StatCard from '@/components/StatCard';
import { generateWeeklyData } from '@/lib/data';
import { Badge } from '@/components/ui/badge';

const Analytics = () => {
  const weeklyData = useMemo(() => generateWeeklyData(), []);
  const avg = Math.round(weeklyData.reduce((s, d) => s + d.protein, 0) / weeklyData.length);
  const daysOnTrack = weeklyData.filter(d => d.protein >= d.goal * 0.7).length;
  const completionRate = Math.round((daysOnTrack / 7) * 100);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-bold text-foreground">Analytics</h1>
          <p className="mb-8 text-muted-foreground">Track your protein trends over time</p>

          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Avg Daily Protein" value={`${avg}g`} subtitle="This week" icon={BarChart3} />
            <StatCard title="Goal Completion" value={`${completionRate}%`} subtitle={`${daysOnTrack}/7 days`} icon={Target} variant={completionRate >= 70 ? 'success' : 'danger'} />
            <StatCard title="Best Day" value={`${Math.max(...weeklyData.map(d => d.protein))}g`} subtitle="Highest intake" icon={TrendingUp} variant="success" />
            <StatCard title="Streak" value="5 days" subtitle="Consecutive goal hits" icon={Award} variant="success" />
          </div>

          {/* Line chart */}
          <div className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-foreground">Daily Protein Intake</h2>
            <p className="mb-6 text-sm text-muted-foreground">Your protein consumption this week</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.75rem',
                      fontSize: 13,
                    }}
                  />
                  <ReferenceLine y={150} stroke="hsl(var(--warning))" strokeDasharray="5 5" label={{ value: 'Goal', fill: 'hsl(var(--warning))', fontSize: 12 }} />
                  <Line type="monotone" dataKey="protein" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 5, fill: 'hsl(var(--primary))' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar chart */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-semibold text-foreground">Weekly Summary</h2>
            <p className="mb-6 text-sm text-muted-foreground">Protein vs goal comparison</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.75rem',
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="protein" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="goal" fill="hsl(var(--border))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Analytics;
