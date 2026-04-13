import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Star, RefreshCw, ChevronRight, Salad, Beef, Egg, Check, ArrowRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

type DietType = 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian';

const diets: { value: DietType; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'Vegetarian', label: 'Vegetarian', icon: Salad, desc: 'Plant-based + dairy' },
  { value: 'Non-Vegetarian', label: 'Non-Vegetarian', icon: Beef, desc: 'All food types' },
  { value: 'Eggetarian', label: 'Eggetarian', icon: Egg, desc: 'Vegetarian + eggs' },
];

const MealPlanner = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [wantHelp, setWantHelp] = useState<boolean | null>(null);
  const [diet, setDiet] = useState<DietType | null>(null);
  const [plans, setPlans] = useState<any[] | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [step, setStep] = useState(0); 
  const [loading, setLoading] = useState(false);

  const proteinGoal = Number(localStorage.getItem('proteinGoal') || '120');

  const fetchPlans = async () => {
    if (!diet) return;
    setLoading(true);
    try {
      const data = await apiFetch('/calculator/generate-meal-plan', {
        method: 'POST',
        body: JSON.stringify({ proteinGoal, dietType: diet })
      });
      setPlans(data);
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => fetchPlans();
  const handleRegenerate = () => fetchPlans();

  const handleSave = async () => {
    if (selectedPlan === null || !plans) return;
    const plan = plans[selectedPlan];
    
    setLoading(true);
    try {
      await apiFetch('/meal-plan/save', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          planData: plan.foods,
          totalProtein: plan.totalProtein,
          isCustom: false
        })
      });
      localStorage.setItem('onboardingComplete', 'true');
      toast.success('Your meal plan has been saved!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save your meal plan');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => navigate('/dashboard');

  const progressValue = step === 0 ? 33 : step === 1 ? 66 : 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>Meal Planning</span>
            <span>{Math.round(progressValue)}%</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="ask" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} className="rounded-2xl border bg-card p-8 shadow-lg">
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-4">
                  <Utensils className="h-7 w-7 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Meal Planning Assistant</h1>
                <p className="mt-2 text-muted-foreground">Your protein goal is <span className="font-bold text-primary">{proteinGoal}g/day</span>. Want help planning your meals?</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => { setWantHelp(true); setStep(1); }} size="lg" className="h-auto py-4 flex-col gap-1">
                  <Check className="h-5 w-5" />
                  <span>Yes, help me plan</span>
                </Button>
                <Button variant="outline" onClick={handleSkip} size="lg" className="h-auto py-4 flex-col gap-1">
                  <ArrowRight className="h-5 w-5" />
                  <span>Skip for now</span>
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="diet" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} className="rounded-2xl border bg-card p-8 shadow-lg">
              <button onClick={() => setStep(0)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Back</button>
              <div className="mb-6 text-center">
                <Salad className="mx-auto mb-3 h-10 w-10 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Diet Preference</h2>
                <p className="mt-1 text-sm text-muted-foreground">We'll tailor meal plans to your diet</p>
              </div>
              <div className="space-y-3 mb-6">
                {diets.map(d => (
                  <button key={d.value} onClick={() => setDiet(d.value)} className={cn('w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all', diet === d.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50')}>
                    <d.icon className={cn('h-6 w-6', diet === d.value ? 'text-primary' : 'text-muted-foreground')} />
                    <div>
                      <p className="font-semibold text-foreground">{d.label}</p>
                      <p className="text-sm text-muted-foreground">{d.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <Button onClick={handleGenerate} className="w-full" disabled={!diet || loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? 'Generating...' : 'Generate Meal Plans'} <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === 2 && plans && (
            <motion.div key="plans" initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} className="rounded-2xl border bg-card p-8 shadow-lg">
              <button onClick={() => setStep(1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Back</button>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Your Meal Plans</h2>
                  <p className="text-sm text-muted-foreground">Target: {proteinGoal}g protein/day</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />} Regenerate
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                {plans.map((plan, idx) => (
                  <button key={idx} onClick={() => setSelectedPlan(idx)} className={cn('w-full rounded-xl border-2 p-5 text-left transition-all', selectedPlan === idx ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/30', plan.recommended && selectedPlan !== idx && 'border-primary/40')}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">Option {plan.option}</span>
                        {plan.recommended && <Badge className="bg-primary text-primary-foreground text-xs"><Star className="mr-1 h-3 w-3" />Recommended</Badge>}
                      </div>
                      <span className="text-lg font-bold text-primary">{Math.round(plan.totalProtein)}g</span>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Suggested Foods</p>
                      {plan.foods.map((item: any, i: number) => (
                        <p key={i} className="text-xs text-foreground">{item.foodName} ({item.quantity}g) — <span className="text-primary font-medium">{Math.round(item.protein)}g</span></p>
                      ))}
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{Math.round((plan.totalProtein / proteinGoal) * 100)}% of goal</span>
                      </div>
                      <Progress value={Math.min(100, (plan.totalProtein / proteinGoal) * 100)} className="h-1.5" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleSave} disabled={selectedPlan === null} className="w-full">
                  <Check className="mr-2 h-4 w-4" /> Save & Continue
                </Button>
                <Button variant="outline" onClick={handleSkip}>Skip to Dashboard</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MealPlanner;
