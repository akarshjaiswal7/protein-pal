import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, User, Target, ChevronRight, ChevronLeft, Sparkles, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { calculateBMI, calculateProteinGoal, UserStats, BMIResult } from '@/lib/protein-calculator';

const activityLevels = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active'] as const;
const goals = ['Weight Loss', 'Maintenance', 'Muscle Gain'] as const;
const genders = ['Male', 'Female', 'Other'] as const;

const TOTAL_STEPS = 4;

const Onboarding = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'new' | 'existing' | null>(null);
  const [step, setStep] = useState(0);
  const [stats, setStats] = useState<UserStats>({
    age: 25, gender: 'Male', height: 170, weight: 70,
    activityLevel: 'Moderate', goal: 'Maintenance',
  });
  const [bmi, setBmi] = useState<BMIResult | null>(null);
  const [proteinGoal, setProteinGoal] = useState<{ min: number; max: number; recommended: number } | null>(null);
  const [customGoal, setCustomGoal] = useState('');
  const [existingGoal, setExistingGoal] = useState('');

  const handleUserTypeSelect = (type: 'new' | 'existing') => {
    setUserType(type);
    setStep(type === 'new' ? 1 : -1);
  };

  const handleCalculate = () => {
    const bmiResult = calculateBMI(stats.weight, stats.height);
    setBmi(bmiResult);
    const goalResult = calculateProteinGoal(stats);
    setProteinGoal(goalResult);
    setCustomGoal(String(goalResult.recommended));
    setStep(3);
  };

  const handleAcceptGoal = () => {
    const goal = userType === 'existing' ? Number(existingGoal) : Number(customGoal);
    localStorage.setItem('proteinGoal', String(goal));
    localStorage.setItem('onboardingComplete', 'true');
    localStorage.setItem('userStats', JSON.stringify(stats));
    navigate('/meal-planner');
  };

  const handleExistingSubmit = () => {
    if (!existingGoal || Number(existingGoal) <= 0) return;
    localStorage.setItem('proteinGoal', existingGoal);
    localStorage.setItem('onboardingComplete', 'true');
    navigate('/meal-planner');
  };

  const progressValue = userType === 'new' ? (step / TOTAL_STEPS) * 100 : 50;

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {(userType !== null) && (
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-xs text-muted-foreground">
              <span>Step {userType === 'existing' ? 1 : step} of {userType === 'existing' ? 1 : TOTAL_STEPS}</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="type" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="rounded-2xl border bg-card p-8 shadow-lg">
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-4">
                  <Dumbbell className="h-7 w-7 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Welcome to ProteinPal!</h1>
                <p className="mt-2 text-muted-foreground">Are you new to protein tracking or do you already have a goal?</p>
              </div>
              <div className="grid gap-4">
                <button onClick={() => handleUserTypeSelect('new')} className="group flex items-center gap-4 rounded-xl border-2 border-border bg-muted/30 p-5 text-left transition-all hover:border-primary hover:bg-primary/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Sparkles className="h-6 w-6" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">I'm new — help me set a goal</p>
                    <p className="text-sm text-muted-foreground">We'll calculate your ideal protein intake</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
                <button onClick={() => handleUserTypeSelect('existing')} className="group flex items-center gap-4 rounded-xl border-2 border-border bg-muted/30 p-5 text-left transition-all hover:border-primary hover:bg-primary/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent"><Target className="h-6 w-6" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">I already have a goal</p>
                    <p className="text-sm text-muted-foreground">I know my daily protein target</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              </div>
            </motion.div>
          )}

          {step === -1 && (
            <motion.div key="existing" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="rounded-2xl border bg-card p-8 shadow-lg">
              <button onClick={() => { setUserType(null); setStep(0); }} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Back</button>
              <div className="mb-6 text-center">
                <Target className="mx-auto mb-3 h-10 w-10 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Enter Your Protein Goal</h2>
                <p className="mt-1 text-sm text-muted-foreground">How many grams of protein do you aim for daily?</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="goal">Daily Protein Goal (grams)</Label>
                  <Input id="goal" type="number" placeholder="e.g. 120" value={existingGoal} onChange={e => setExistingGoal(e.target.value)} className="mt-1 text-center text-2xl font-bold h-14" />
                </div>
                <Button onClick={handleExistingSubmit} className="w-full" disabled={!existingGoal || Number(existingGoal) <= 0}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="data" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="rounded-2xl border bg-card p-8 shadow-lg">
              <button onClick={() => { setUserType(null); setStep(0); }} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Back</button>
              <div className="mb-6 text-center">
                <User className="mx-auto mb-3 h-10 w-10 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Tell us about yourself</h2>
                <p className="mt-1 text-sm text-muted-foreground">We'll use this to calculate your ideal protein intake</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Age</Label>
                    <Input type="number" value={stats.age} onChange={e => setStats(s => ({ ...s, age: +e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <div className="mt-1 flex gap-2">
                      {genders.map(g => (
                        <button key={g} onClick={() => setStats(s => ({ ...s, gender: g }))} className={cn('flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-all', stats.gender === g ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50')}>{g}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Height (cm)</Label>
                    <Input type="number" value={stats.height} onChange={e => setStats(s => ({ ...s, height: +e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input type="number" value={stats.weight} onChange={e => setStats(s => ({ ...s, weight: +e.target.value }))} className="mt-1" />
                  </div>
                </div>
                <Button onClick={() => setStep(2)} className="w-full">Continue <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="activity" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="rounded-2xl border bg-card p-8 shadow-lg">
              <button onClick={() => setStep(1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Back</button>
              <div className="mb-6 text-center">
                <Target className="mx-auto mb-3 h-10 w-10 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Activity & Goals</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <Label className="mb-2 block">Activity Level</Label>
                  <div className="flex flex-wrap gap-2">
                    {activityLevels.map(level => (
                      <button key={level} onClick={() => setStats(s => ({ ...s, activityLevel: level }))} className={cn('rounded-lg border px-3 py-2 text-sm font-medium transition-all', stats.activityLevel === level ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50')}>{level}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Goal</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {goals.map(g => (
                      <button key={g} onClick={() => setStats(s => ({ ...s, goal: g }))} className={cn('rounded-lg border px-3 py-3 text-sm font-medium transition-all text-center', stats.goal === g ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50')}>{g}</button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCalculate} className="w-full">Calculate My Goal <Sparkles className="ml-2 h-4 w-4" /></Button>
              </div>
            </motion.div>
          )}

          {step === 3 && bmi && proteinGoal && (
            <motion.div key="results" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="rounded-2xl border bg-card p-8 shadow-lg">
              <button onClick={() => setStep(2)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Back</button>
              <div className="mb-6 text-center">
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Your Results</h2>
              </div>

              <div className="mb-6 rounded-xl border bg-muted/30 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Your BMI</span>
                  <Badge className={cn('text-xs', bmi.color === 'success' ? 'bg-success text-success-foreground' : bmi.color === 'warning' ? 'bg-warning text-warning-foreground' : 'bg-danger text-danger-foreground')}>{bmi.category}</Badge>
                </div>
                <p className="text-3xl font-bold text-foreground">{bmi.value}</p>
                <p className="mt-2 text-sm text-muted-foreground italic">{bmi.message}</p>
              </div>

              <div className="mb-6 rounded-xl border-2 border-primary/20 bg-primary/5 p-5">
                <p className="text-sm text-muted-foreground mb-1">Recommended daily protein intake</p>
                <p className="text-4xl font-extrabold text-primary">{proteinGoal.recommended}g<span className="text-base font-normal text-muted-foreground">/day</span></p>
                <p className="mt-2 text-xs text-muted-foreground">Range: {proteinGoal.min}g – {proteinGoal.max}g based on your stats</p>
              </div>

              <div className="mb-4">
                <Label>Customize Goal (grams)</Label>
                <Input type="number" value={customGoal} onChange={e => setCustomGoal(e.target.value)} className="mt-1 text-center text-lg font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleAcceptGoal} className="w-full">
                  <Check className="mr-2 h-4 w-4" /> Accept Goal
                </Button>
                <Button variant="outline" onClick={() => setStep(2)}>Adjust Stats</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
