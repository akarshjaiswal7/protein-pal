import { BarChart3, TrendingUp, Target, Award, Loader2, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import AppNavbar from '@/components/AppNavbar';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Analytics = () => {
  const { userId } = useAuth();

  const { data: weeklyData = [], isLoading } = useQuery({
    queryKey: ['weekly-summary', userId],
    queryFn: () => apiFetch(`/analytics/weekly-summary/${userId}`),
    enabled: !!userId,
  });

  const { data: allIntakes = [] } = useQuery({
    queryKey: ['all-intakes', userId],
    queryFn: () => apiFetch(`/intake/${userId}`),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #060b18 0%, #0a111f 100%)' }}>
        <AppNavbar />
        <main className="container py-20 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/30 mr-3" />
          <p className="text-white/30">Loading analytics...</p>
        </main>
      </div>
    );
  }

  const totalProteinSum = weeklyData.reduce((s: number, d: any) => s + d.protein, 0);
  const activeDays = weeklyData.filter((d: any) => d.protein > 0).length || 1;
  const avg = Math.round(totalProteinSum / activeDays);

  const daysOnTrack = weeklyData.filter((d: any) => d.goal > 0 && d.protein >= d.goal * 0.9).length;
  const completionRate = Math.round((daysOnTrack / 7) * 100);
  const bestDay = Math.max(...weeklyData.map((d: any) => d.protein), 0);

  // Streak calc
  let streak = 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayIdx = weeklyData.findIndex((d: any) => d.date === todayStr);
  if (todayIdx !== -1) {
    let checkIdx = todayIdx;
    while (checkIdx >= 0) {
      const dayData = weeklyData[checkIdx];
      if (checkIdx === todayIdx && dayData.protein === 0) { checkIdx--; continue; }
      if (dayData.goal > 0 && dayData.protein >= dayData.goal * 0.9) { streak++; checkIdx--; }
      else break;
    }
  }

  // Historical logs grouped by date
  const groupedIntakes = allIntakes.reduce((acc: any, curr: any) => {
    const date = curr.IntakeDate?.split('T')[0] || curr.IntakeDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(curr);
    return acc;
  }, {});
  const dates = Object.keys(groupedIntakes).sort((a, b) => b.localeCompare(a));

  const statCards = [
    { label: 'Avg Daily Protein', value: `${avg}g`, sub: 'Active days only', icon: BarChart3, color: '#4ade80' },
    { label: 'Weekly Completion', value: `${totalProteinSum === 0 ? 0 : completionRate}%`, sub: `${daysOnTrack}/7 days on target`, icon: Target, color: completionRate >= 70 ? '#4ade80' : '#f87171' },
    { label: 'Best Day', value: `${bestDay}g`, sub: 'Highest single day', icon: TrendingUp, color: '#22d3ee' },
    { label: 'Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, sub: 'Consecutive goal hits', icon: Award, color: streak > 0 ? '#fbbf24' : '#6b7280' },
  ];

  const tooltipStyle = {
    contentStyle: { background: 'rgba(10,14,26,0.97)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, fontSize: 12, color: 'white' },
    labelStyle: { color: 'rgba(255,255,255,0.6)' },
    itemStyle: { color: '#4ade80' },
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #060b18 0%, #0a111f 100%)' }}>
      <AppNavbar />
      <main className="container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">Analytics</h1>
          <p className="text-white/40 mb-8">Track your protein trends over time</p>

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className="rounded-2xl border p-5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-white/50 text-sm">{s.label}</p>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18` }}>
                      <Icon className="h-4 w-4" style={{ color: s.color }} />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-white/30 mt-1">{s.sub}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Line chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mb-6 rounded-2xl border p-6" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-lg font-bold text-white mb-1">Weekly Protein Intake</h2>
            <p className="text-white/30 text-sm mb-6">Mon–Sun protein consumption vs goal</p>
            <div className="h-64">
              {totalProteinSum === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/20">
                  <BarChart3 className="h-10 w-10 mb-2" />
                  <p>No data logged this week</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.25)" fontSize={12} tick={{ fill: 'rgba(255,255,255,0.4)' }} />
                    <YAxis stroke="rgba(255,255,255,0.25)" fontSize={12} tick={{ fill: 'rgba(255,255,255,0.4)' }} />
                    <Tooltip {...tooltipStyle} />
                    {weeklyData[0]?.goal > 0 && (
                      <ReferenceLine y={weeklyData[0].goal} stroke="#fbbf24" strokeDasharray="5 5"
                        label={{ value: 'Goal', fill: '#fbbf24', fontSize: 11, position: 'right' }} />
                    )}
                    <Line type="monotone" dataKey="protein" stroke="#4ade80" strokeWidth={2.5}
                      dot={{ r: 4, fill: '#4ade80', stroke: '#060b18', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#4ade80' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Historical Logs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-2xl border p-6" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-lg font-bold text-white mb-1">Historical Logs</h2>
            <p className="text-white/30 text-sm mb-6">Every meal logged by day</p>

            {dates.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-white/20">
                <Utensils className="mb-3 h-8 w-8" />
                <p className="text-sm">No meal history found.</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {dates.map(dateStr => {
                  const dayLogs = groupedIntakes[dateStr];
                  const dayTotal = dayLogs.reduce((s: number, i: any) => s + ((i.ProteinPer100g / 100) * i.QuantityInGrams), 0);
                  return (
                    <AccordionItem key={dateStr} value={dateStr}
                      className="rounded-xl border px-4" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="flex justify-between w-full pr-4">
                          <span className="font-medium text-white/80 text-sm">
                            {new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="font-black text-sm" style={{ color: '#4ade80' }}>{Math.round(dayTotal)}g</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pb-2">
                          {dayLogs.map((intake: any) => {
                            const protein = (intake.ProteinPer100g / 100) * intake.QuantityInGrams;
                            return (
                              <div key={intake.IntakeID} className="flex justify-between items-center rounded-xl p-3 border"
                                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
                                <div>
                                  <p className="font-medium text-white/80 text-sm">{intake.FoodName}</p>
                                  <p className="text-xs text-white/35">
                                    {parseFloat(intake.QuantityInGrams)}g · {intake.MealType}
                                    {intake.IntakeTime ? ` · ${intake.IntakeTime.slice(0, 5)}` : ''}
                                  </p>
                                </div>
                                <p className="font-bold text-sm" style={{ color: '#4ade80' }}>{Math.round(protein)}g</p>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
};

export default Analytics;
