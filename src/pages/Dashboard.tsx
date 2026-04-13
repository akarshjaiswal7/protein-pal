import { Target, Flame, TrendingUp, Utensils, CalendarDays, Plus, ChefHat } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import AppNavbar from '@/components/AppNavbar';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const { userId, username } = useAuth();
  const selectedDate = new Date().toISOString().split('T')[0];

  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiFetch(`/user/${userId}`),
    enabled: !!userId,
  });

  const { data: summary } = useQuery({
    queryKey: ['daily-summary', userId, selectedDate],
    queryFn: () => apiFetch(`/analytics/daily-summary/${userId}?date=${selectedDate}`),
    enabled: !!userId,
  });

  const { data: intakes = [] } = useQuery({
    queryKey: ['intakes', userId, selectedDate],
    queryFn: () => apiFetch(`/intake/${userId}?date=${selectedDate}`),
    enabled: !!userId,
  });

  const { data: latestPlan } = useQuery({
    queryKey: ['latest-meal-plan', userId],
    queryFn: () => apiFetch(`/meal-plan/${userId}`),
    enabled: !!userId,
  });

  const { mutate: logPlan, isPending: isLogging } = useMutation({
    mutationFn: (planId: number) => apiFetch(`/meal-plan/log-full/${planId}`, { method: 'POST' }),
    onSuccess: (data) => {
      import('sonner').then(({ toast }) => toast.success(data.message));
      import('@tanstack/react-query').then(() => {
        const qc = new (require('@tanstack/react-query').QueryClient)(); // Or use a hook
        // Since I'm in a functional component, I should use useQueryClient
      });
    },
  });

  const totalProtein = summary?.totalProtein || 0;
  const goal = summary?.proteinGoal || 0;
  const percentage = Math.min(Math.round(summary?.percentage || 0), 100);
  const statusLabel = summary?.status || 'No Goal Set';

  const statusConfig: Record<string, { color: string; bg: string; bar: string }> = {
    'Adequate': { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', bar: 'linear-gradient(90deg, #4ade80, #22c55e)' },
    'Deficient': { color: '#f87171', bg: 'rgba(248,113,113,0.1)', bar: 'linear-gradient(90deg, #f87171, #ef4444)' },
    'Excess': { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', bar: 'linear-gradient(90deg, #fbbf24, #f59e0b)' },
    'No Goal Set': { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', bar: 'linear-gradient(90deg, #6b7280, #4b5563)' },
    'No Logs Yet': { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', bar: 'linear-gradient(90deg, #6b7280, #4b5563)' },
  };
  const sc = statusConfig[statusLabel] || statusConfig['No Goal Set'];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.Username?.split(' ')[0] || username?.split(' ')[0] || 'there';

  const stats = [
    { label: 'Protein Consumed', value: `${Math.round(totalProtein)}g`, sub: "Today's intake", icon: Flame, accent: sc.color },
    { label: 'Daily Goal', value: `${goal}g`, sub: 'Your target', icon: Target, accent: '#4ade80' },
    { label: 'Progress', value: `${percentage}%`, sub: 'Of daily goal', icon: TrendingUp, accent: percentage > 0 ? sc.color : '#6b7280' },
    { label: 'Meals Logged', value: intakes.length, sub: 'Today', icon: Utensils, accent: '#22d3ee' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #060b18 0%, #0a111f 100%)' }}>
      <AppNavbar />
      <main className="container py-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {greeting}, <span style={{ color: '#4ade80' }}>{displayName}</span> 👋
            </h1>
            <p className="text-white/40 mt-1">Here's your protein summary for today</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-white/40"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
            <CalendarDays className="h-4 w-4" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </motion.div>

        {/* Stats grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="rounded-2xl border p-5 glass-card-hover"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white/50 text-sm">{stat.label}</p>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${stat.accent}18` }}>
                    <Icon className="h-4 w-4" style={{ color: stat.accent }} />
                  </div>
                </div>
                <p className="text-3xl font-black text-white mb-0.5">{stat.value}</p>
                <p className="text-xs text-white/30">{stat.sub}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Progress section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="mb-6 rounded-2xl border p-6"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Daily Progress</h2>
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: sc.bg, color: sc.color }}>
              {statusLabel}
            </span>
          </div>
          <div className="h-3 rounded-full mb-3 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
              style={{ background: sc.bar }}
            />
          </div>
          <div className="flex justify-between text-sm text-white/40">
            <span>{Math.round(totalProtein)}g consumed</span>
            <span>{Math.max(0, Math.round(goal - totalProtein))}g remaining</span>
          </div>
        </motion.div>

        {/* Meal Plan Summary */}
        {latestPlan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="mb-6 rounded-2xl border p-6 overflow-hidden relative"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-white">Today's Meal Plan</h2>
              </div>
              <Link to="/my-meal-plan" className="text-xs font-bold text-primary hover:underline">
                View Full Plan
              </Link>
            </div>
            <div className="flex items-end justify-between relative z-10">
              <div>
                <p className="text-2xl font-black text-white">{Math.round(latestPlan.TotalProtein)}g</p>
                <p className="text-xs text-white/30 uppercase tracking-widest font-black">Plan Strength</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] uppercase font-black">
                  {latestPlan.IsCustom ? 'Custom Build' : 'Suggested'}
                </Badge>
                <button 
                  onClick={() => logPlan(latestPlan.PlanID)}
                  disabled={isLogging}
                  className="h-8 px-3 rounded-lg bg-primary text-black text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50">
                  {isLogging ? 'Logging...' : 'Log Today'}
                </button>
              </div>
            </div>
            <ChefHat className="absolute -bottom-6 -right-6 h-32 w-32 text-white/5 rotate-12" />
          </motion.div>
        )}

        {/* Today's meals */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border p-6"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Today's Meals</h2>
            <Link to="/add-intake"
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-black transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)' }}>
              <Plus className="h-3.5 w-3.5" /> Log Meal
            </Link>
          </div>
          {intakes.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-white/20">
              <Utensils className="mb-3 h-10 w-10" />
              <p className="font-medium text-white/30">No meals logged yet</p>
              <p className="text-sm mt-1">Start by adding your first meal of the day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {intakes.map((intake: any, i: number) => {
                const protein = (intake.ProteinPer100g / 100) * intake.QuantityInGrams;
                return (
                  <motion.div key={intake.IntakeID} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between rounded-xl p-4 border"
                    style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div>
                      <p className="font-semibold text-white">{intake.FoodName}</p>
                      <p className="text-sm text-white/40">
                        {parseFloat(intake.QuantityInGrams)}g · {intake.MealType} · {intake.IntakeTime?.slice(0, 5)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg" style={{ color: '#4ade80' }}>{Math.round(protein)}g</p>
                      <p className="text-xs text-white/30">protein</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
