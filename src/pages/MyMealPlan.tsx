import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Utensils, History, Plus, Save, Trash2, CheckCircle2, 
  ChefHat, Loader2, Search, ArrowRight, Activity, Zap, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import AppNavbar from '@/components/AppNavbar';

const MyMealPlan = () => {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'current' | 'history' | 'builder'>('current');
  const [search, setSearch] = useState('');
  const [planName, setPlanName] = useState('');
  const [customItems, setCustomItems] = useState<any[]>([]);
  const [viewingPlanId, setViewingPlanId] = useState<number | null>(null);

  // Queries
  const { data: latestPlan, isLoading: planLoading } = useQuery({
    queryKey: ['latest-meal-plan', userId],
    queryFn: () => apiFetch(`/meal-plan/${userId}`),
    enabled: !!userId,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['meal-plan-history', userId],
    queryFn: () => apiFetch(`/meal-plan/history/${userId}`),
    enabled: !!userId,
  });

  const { data: foods = [] } = useQuery({
    queryKey: ['all-foods'],
    queryFn: () => apiFetch('/foods'),
  });

  const { data: detailsPlan, isLoading: detailsLoading } = useQuery({
    queryKey: ['meal-plan-details', viewingPlanId],
    queryFn: () => apiFetch(`/meal-plan/details/${viewingPlanId}`),
    enabled: !!viewingPlanId,
  });

  // Mutations
  const logPlanMut = useMutation({
    mutationFn: (planId: number) => apiFetch(`/meal-plan/log-full/${planId}`, { method: 'POST' }),
    onSuccess: (data) => {
      toast.success(data.message || 'Plan logged successfully');
      queryClient.invalidateQueries({ queryKey: ['intakes'] });
      queryClient.invalidateQueries({ queryKey: ['daily-summary'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveCustomMut = useMutation({
    mutationFn: (data: any) => apiFetch('/meal-plan/save', { 
      method: 'POST', 
      body: JSON.stringify({ ...data, userId, isCustom: true }) 
    }),
    onSuccess: () => {
      toast.success('Custom meal plan saved!');
      setCustomItems([]);
      setPlanName('');
      setActiveTab('current');
      queryClient.invalidateQueries({ queryKey: ['latest-meal-plan'] });
      queryClient.invalidateQueries({ queryKey: ['meal-plan-history'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reactivateMut = useMutation({
    mutationFn: (plan: any) => apiFetch('/meal-plan/save', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        planData: parsePlanData(plan.PlanData),
        totalProtein: plan.TotalProtein,
        isCustom: !!plan.IsCustom,
        planName: plan.PlanName
      })
    }),
    onSuccess: () => {
      toast.success('Plan re-activated!');
      setViewingPlanId(null);
      setActiveTab('current');
      queryClient.invalidateQueries({ queryKey: ['latest-meal-plan'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Builder Logic
  const filteredFoods = foods.filter((f: any) => 
    f.FoodName.toLowerCase().includes(search.toLowerCase())
  );

  const addItem = (food: any) => {
    if (customItems.find(i => i.foodId === food.FoodID)) return;
    setCustomItems([...customItems, { 
      foodId: food.FoodID, 
      foodName: food.FoodName, 
      quantity: 100, 
      protein: food.ProteinPer100g 
    }]);
    setSearch('');
  };

  const removeItem = (id: number) => {
    setCustomItems(customItems.filter(i => i.foodId !== id));
  };

  const updateQuantity = (id: number, qty: number) => {
    const validQty = Math.max(0, Number(qty) || 0);
    setCustomItems(current => current.map(i => {
      if (i.foodId === id) {
        const food = foods.find((f: any) => f.FoodID === id);
        const baseProtein = Number(food?.ProteinPer100g) || 0;
        // Fix for "high values": Ensure we don't accidentally concatenate strings
        // and round to 1 decimal place to prevent floating point glitches
        const newProtein = Number(((baseProtein / 100) * validQty).toFixed(1));
        return { ...i, quantity: validQty, protein: newProtein };
      }
      return i;
    }));
  };

  // Safe JSON Parsing Helper
  const parsePlanData = (data: any) => {
    if (!data) return [];
    if (typeof data === 'object' && !Array.isArray(data)) return data; // Already an object (some drivers do this)
    if (Array.isArray(data)) return data; 
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  const totalCustomProtein = customItems.reduce((acc, i) => acc + (Number(i.protein) || 0), 0);

  const containerStyle = { background: 'linear-gradient(160deg, #060b18 0%, #0a111f 100%)' };
  const cardBg = 'rgba(255,255,255,0.03)';
  const borderColor = 'rgba(255,255,255,0.06)';

  return (
    <div className="min-h-screen" style={containerStyle}>
      <AppNavbar />
      <main className="container py-8 max-w-4xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Nutrition Strategy</h1>
            <p className="text-white/40 mt-1">Manage your protein roadmap and meal schedules</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 self-start">
            {[
              { id: 'current', label: 'Active Plan', icon: Zap },
              { id: 'history', label: 'History', icon: History },
              { id: 'builder', label: 'Builder', icon: Plus },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-lg' : 'text-white/40 hover:text-white/70'}`}>
                <tab.icon className="h-4 w-4" /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── CURRENT PLAN ── */}
          {activeTab === 'current' && (
            <motion.div key="current" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {planLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
              ) : !latestPlan ? (
                <div className="text-center py-20 rounded-3xl border border-dashed border-white/10" style={{ background: 'rgba(255,255,255,0.01)' }}>
                  <ChefHat className="h-12 w-12 text-white/10 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white">No active plan found</h3>
                  <p className="text-white/30 mt-2 mb-6">Create a custom plan or redo onboarding to generate one.</p>
                  <Button onClick={() => setActiveTab('builder')} className="rounded-xl px-8 font-bold">Start Building</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="rounded-3xl border p-8" style={{ background: cardBg, borderColor }}>
                    <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <h2 className="text-2xl font-black text-white">Active Roadmap</h2>
                        </div>
                        <p className="text-white/40">Created {new Date(latestPlan.CreatedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-4xl font-black text-primary leading-none">{Math.round(Number(latestPlan.TotalProtein) || 0)}g</p>
                        <p className="text-xs uppercase tracking-widest font-black text-white/30 mt-1">Total Protein Target</p>
                      </div>
                    </div>

                    <div className="grid gap-3 mb-8">
                      {parsePlanData(latestPlan.PlanData).map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/2 border border-white/5">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-white/40">{i+1}</div>
                            <div>
                              <p className="font-bold text-white">{item.foodName}</p>
                              <p className="text-xs text-white/30">{item.quantity}g portion</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white/80">{Math.round(item.protein)}g</p>
                            <p className="text-[10px] uppercase text-white/20 font-black">protein</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button onClick={() => logPlanMut.mutate(latestPlan.PlanID)} 
                      disabled={logPlanMut.isPending}
                      className="w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
                      {logPlanMut.isPending ? <Loader2 className="animate-spin h-5 w-5 text-black" /> : <Zap className="h-5 w-5 fill-current" />}
                      One-Click Log Today's Plan
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── HISTORY ── */}
          {activeTab === 'history' && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-20 text-white/20">No plan history found</div>
              ) : (
                 history.map((h: any) => (
                   <div key={h.PlanID} className="rounded-2xl border p-5 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer group"
                    style={{ background: cardBg, borderColor }}
                    onClick={() => setViewingPlanId(h.PlanID)}>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <History className="h-5 w-5 text-white/20" />
                      </div>
                      <div>
                        <p className="font-bold text-white uppercase tracking-tight text-sm">
                          {h.PlanName || `Meal Plan #${h.PlanID}`}
                        </p>
                        <p className="text-xs text-white/30 font-medium">{new Date(h.CreatedAt).toLocaleDateString()} · {h.IsCustom ? 'Custom' : 'Suggested'}</p>
                      </div>
                    </div>
                    <div className="text-left md:text-right">
                        <p className="text-4xl font-black text-primary leading-none">{Math.round(Number(h.TotalProtein) || 0)}g</p>
                        <p className="text-[10px] text-white/20 font-black uppercase tracking-tighter">Total Protein</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/10 group-hover:text-primary transition-colors" />
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* ── BUILDER ── */}
          {activeTab === 'builder' && (
            <motion.div key="builder" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Food Selection */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input placeholder="Search global foods..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl" />
                </div>
                <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {filteredFoods.length > 0 ? filteredFoods.slice(0, search ? 100 : 20).map((f: any) => (
                    <button key={f.FoodID} onClick={() => addItem(f)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all text-left group">
                      <div>
                        <p className="font-bold text-white text-sm">{f.FoodName}</p>
                        <p className="text-xs text-white/30">{f.ProteinPer100g}g protein / 100g</p>
                      </div>
                      <Plus className="h-4 w-4 text-white/10 group-hover:text-primary whitespace-nowrap" />
                    </button>
                  )) : (
                    <div className="text-center py-20 text-white/5">No foods found matching "{search}"</div>
                  )}
                </div>
              </div>

              {/* Right: Custom Plan List */}
              <div className="rounded-3xl border p-6 flex flex-col h-full" style={{ background: cardBg, borderColor }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Custom Plan Items</h3>
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-none">{customItems.length} items</Badge>
                </div>

                <div className="flex-1 space-y-3 mb-6 overflow-y-auto pr-1">
                  {customItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-white/10 text-center">
                      <ChefHat className="h-8 w-8 mb-2" />
                      <p className="text-xs">Your draft is empty</p>
                    </div>
                  ) : customItems.map(item => (
                    <div key={item.foodId} className="p-3 rounded-2xl bg-white/2 border border-white/5">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-white text-sm leading-tight pr-4">{item.foodName}</p>
                        <button onClick={() => removeItem(item.foodId)} className="text-white/10 hover:text-red-400 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <Input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.foodId, Number(e.target.value))}
                            className="w-20 h-8 bg-black/40 border-white/10 text-xs px-2" />
                          <span className="text-[10px] text-white/30 font-bold uppercase">grams</span>
                        </div>
                        <p className="text-primary font-bold text-sm">{Math.round(item.protein)}g</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto space-y-4 pt-6 border-t border-white/5">
                  <div className="space-y-2">
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Plan Identity</p>
                    <Input placeholder="Give your plan a name (optional)" value={planName} onChange={(e) => setPlanName(e.target.value)}
                      className="h-10 bg-black/40 border-white/10 text-sm" />
                  </div>
                  <div className="flex justify-between items-end pt-2">
                    <div>
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mb-1">Estimated Protein</p>
                      <p className="text-3xl font-black text-primary">{Math.round(totalCustomProtein)}g</p>
                    </div>
                    <Button onClick={() => saveCustomMut.mutate({ planData: customItems, totalProtein: totalCustomProtein, planName })}
                      disabled={customItems.length === 0 || saveCustomMut.isPending}
                      className="rounded-xl flex items-center gap-2 bg-primary hover:bg-primary/90 transition-all active:scale-95">
                      {saveCustomMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Plan
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── DETAILS MODAL ── */}
        <AnimatePresence>
          {viewingPlanId && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setViewingPlanId(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg rounded-3xl border border-white/10 p-8 overflow-hidden shadow-2xl" 
                style={{ background: '#0a111f' }}>
                {detailsLoading ? (
                  <div className="py-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                ) : detailsPlan && (
                  <>
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-black text-white">{detailsPlan.PlanName || 'Plan Details'}</h2>
                        <p className="text-white/30 text-xs uppercase tracking-widest font-bold mt-1">
                          {detailsPlan.PlanName ? `Plan ID: #${detailsPlan.PlanID}` : 'Historical Record'}
                        </p>
                      </div>
                      <button onClick={() => setViewingPlanId(null)} className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <Plus className="h-5 w-5 text-white/40 rotate-45" />
                      </button>
                    </div>

                    <div className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                      {parsePlanData(detailsPlan.PlanData).map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/2 border border-white/5">
                          <div>
                            <p className="font-bold text-white text-sm">{item.foodName}</p>
                            <p className="text-[10px] text-white/30 uppercase font-black">{item.quantity}g</p>
                          </div>
                          <p className="text-primary font-bold">{Math.round(item.protein)}g</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between p-5 rounded-2xl bg-primary/5 border border-primary/10 mb-8">
                      <div>
                        <p className="text-xs text-primary/60 font-black uppercase tracking-widest">Total Protein</p>
                        <p className="text-3xl font-black text-primary">{Math.round(detailsPlan.TotalProtein)}g</p>
                      </div>
                      <Badge className="bg-primary/20 text-primary border-none">{detailsPlan.IsCustom ? 'Custom' : 'Suggested'}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-12 rounded-xl font-bold border-white/10 text-white/60 hover:text-white" onClick={() => setViewingPlanId(null)}>Close</Button>
                      <Button className="h-12 rounded-xl font-bold gap-2" 
                        onClick={() => reactivateMut.mutate(detailsPlan)}
                        disabled={reactivateMut.isPending}>
                        {reactivateMut.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                        Re-activate Plan
                      </Button>
                    </div>
                  </>
                )}
                {/* Decoration */}
                <ChefHat className="absolute -bottom-10 -left-10 h-40 w-40 text-white/5 -rotate-12 pointer-events-none" />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MyMealPlan;
