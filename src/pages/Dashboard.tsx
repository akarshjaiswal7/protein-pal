import { useState, useMemo } from 'react';
import { Target, Flame, TrendingUp, Utensils, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';
import { mockUser, mockFoods, mockIntakes, calculateProtein, getProteinStatus } from '@/lib/data';
import StatCard from '@/components/StatCard';
import AppNavbar from '@/components/AppNavbar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);

  const todayIntakes = useMemo(
    () => mockIntakes.filter(i => i.intakeDate === selectedDate),
    [selectedDate]
  );

  const totalProtein = useMemo(
    () =>
      todayIntakes.reduce((sum, intake) => {
        const food = mockFoods.find(f => f.foodId === intake.foodId);
        return sum + (food ? calculateProtein(food.proteinPer100g, intake.quantityInGrams) : 0);
      }, 0),
    [todayIntakes]
  );

  const goal = mockUser.proteinGoalPerDay;
  const percentage = Math.min(Math.round((totalProtein / goal) * 100), 100);
  const status = getProteinStatus(totalProtein, goal);

  const statusColorMap: Record<string, string> = {
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
    danger: 'bg-danger text-danger-foreground',
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="container py-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {mockUser.username.split(' ')[0]} 👋
            </h1>
            <p className="text-muted-foreground">Here's your protein summary for today</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Stats grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Protein Consumed" value={`${Math.round(totalProtein)}g`} subtitle="Today's intake" icon={Flame} variant={status.color as 'success' | 'warning' | 'danger'} />
          <StatCard title="Protein Goal" value={`${goal}g`} subtitle="Daily target" icon={Target} />
          <StatCard title="Progress" value={`${percentage}%`} subtitle="Of daily goal" icon={TrendingUp} variant={percentage >= 70 ? 'success' : 'danger'} />
          <StatCard title="Meals Logged" value={todayIntakes.length} subtitle="Today" icon={Utensils} />
        </div>

        {/* Progress section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8 rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Daily Progress</h2>
            <Badge className={cn('text-xs', statusColorMap[status.color])}>{status.label}</Badge>
          </div>
          <Progress value={percentage} className="h-4" />
          <div className="mt-2 flex justify-between text-sm text-muted-foreground">
            <span>{Math.round(totalProtein)}g consumed</span>
            <span>{Math.max(0, Math.round(goal - totalProtein))}g remaining</span>
          </div>
        </motion.div>

        {/* Today's meals */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Today's Meals</h2>
          {todayIntakes.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Utensils className="mb-3 h-10 w-10" />
              <p className="font-medium">No meals logged yet</p>
              <p className="text-sm">Start by adding your first meal of the day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayIntakes.map(intake => {
                const food = mockFoods.find(f => f.foodId === intake.foodId);
                if (!food) return null;
                const protein = calculateProtein(food.proteinPer100g, intake.quantityInGrams);
                return (
                  <div key={intake.intakeId} className="flex items-center justify-between rounded-xl border bg-muted/50 p-4">
                    <div>
                      <p className="font-medium text-foreground">{food.foodName}</p>
                      <p className="text-sm text-muted-foreground">
                        {intake.quantityInGrams}g · {intake.mealType} · {intake.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{Math.round(protein)}g</p>
                      <p className="text-xs text-muted-foreground">protein</p>
                    </div>
                  </div>
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
