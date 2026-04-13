import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Stethoscope, ClipboardList, Send, Plus, Activity, CheckCircle2, XCircle,
  Loader2, Trash2, Users, Database, MessageSquare, Search, ChevronDown, ChevronUp, Filter as FilterIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const categoryMap: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Vegetarian', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  2: { label: 'Non-Veg', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  3: { label: 'Dairy', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)' },
  4: { label: 'Supplement', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
};
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const NutritionistDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'patients' | 'food' | 'notes'>('patients');
  const [noteBuffer, setNoteBuffer] = useState('');
  const [openNoteModal, setOpenNoteModal] = useState<number | null>(null);
  const [expandedPatient, setExpandedPatient] = useState<number | null>(null);
  const [foodSearch, setFoodSearch] = useState('');
  const [foodFilter, setFoodFilter] = useState<'all' | string>('all');
  const [food, setFood] = useState({ name: '', protein: '', calories: '', fat: '', carbs: '', category: '2' });

  const { data: patients = [], isLoading: patientsLoading } = useQuery({
    queryKey: ['nutritionist-patients'],
    queryFn: () => apiFetch('/nutritionist/patients'),
    refetchInterval: 30000,
  });

  const { data: foods = [], isLoading: foodsLoading } = useQuery({
    queryKey: ['nutritionist-foods'],
    queryFn: () => apiFetch('/nutritionist/foods'),
  });

  const { data: myNotes = [] } = useQuery({
    queryKey: ['nutritionist-my-notes'],
    queryFn: () => apiFetch('/nutritionist/notes'),
  });

  // Get notes for expanded patient
  const { data: patientNotes = [] } = useQuery({
    queryKey: ['patient-notes', expandedPatient],
    queryFn: () => apiFetch(`/nutritionist/notes/user/${expandedPatient}`),
    enabled: expandedPatient !== null,
  });



  const addFoodMut = useMutation({
    mutationFn: () => apiFetch('/nutritionist/foods', {
      method: 'POST',
      body: JSON.stringify({
        foodName: food.name.trim(),
        proteinPer100g: parseFloat(food.protein),
        caloriesPer100g: parseFloat(food.calories) || 0,
        fatPer100g: parseFloat(food.fat) || 0,
        carbsPer100g: parseFloat(food.carbs) || 0,
        categoryID: parseInt(food.category),
      })
    }),
    onSuccess: () => {
      toast.success('Food added to system!');
      setFood({ name: '', protein: '', calories: '', fat: '', carbs: '', category: '2' });
      queryClient.invalidateQueries({ queryKey: ['nutritionist-foods'] });
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to add food'),
  });

  const deleteFoodMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/nutritionist/foods/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Food deleted');
      queryClient.invalidateQueries({ queryKey: ['nutritionist-foods'] });
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sendNoteMut = useMutation({
    mutationFn: (userId: number) => apiFetch('/nutritionist/notes', {
      method: 'POST',
      body: JSON.stringify({ userId, content: noteBuffer })
    }),
    onSuccess: () => {
      toast.success('Note dispatched!');
      setOpenNoteModal(null);
      setNoteBuffer('');
      queryClient.invalidateQueries({ queryKey: ['nutritionist-my-notes'] });
      if (expandedPatient) queryClient.invalidateQueries({ queryKey: ['patient-notes', expandedPatient] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteNoteMut = useMutation({
    mutationFn: (noteId: number) => apiFetch(`/nutritionist/notes/${noteId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Note deleted');
      queryClient.invalidateQueries({ queryKey: ['nutritionist-my-notes'] });
      if (expandedPatient) queryClient.invalidateQueries({ queryKey: ['patient-notes', expandedPatient] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const tabs = [
    { key: 'patients', label: 'Patients', icon: Users },
    { key: 'food', label: 'Food DB', icon: Database },
    { key: 'notes', label: 'Notes Log', icon: MessageSquare },
  ];

  const iClass = "bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-11 focus:border-cyan-500/40";
  const lClass = "text-white/50 text-xs uppercase tracking-widest font-semibold mb-1.5 block";

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #060d18 0%, #0a1520 100%)' }}>
      <AppNavbar />
      <main className="container py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, #22d3ee, #3b82f6)' }}>
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Nutritionist Portal</h1>
              <p className="text-white/40 text-sm">Patient oversight · Food management · Notes & advice</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 p-1 rounded-2xl w-fit border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.key ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
                  style={activeTab === tab.key ? { background: 'linear-gradient(135deg, #22d3ee, #3b82f6)' } : {}}>
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">

            {/* ── PATIENTS TAB ── */}
            {activeTab === 'patients' && (
              <motion.div key="patients" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <h2 className="text-white font-bold text-lg">Patient Audit</h2>
                    <p className="text-white/30 text-sm mt-0.5">Click a patient to view their notes history</p>
                  </div>
                  {patientsLoading ? (
                    <div className="flex items-center justify-center py-14"><Loader2 className="h-5 w-5 animate-spin text-white/30 mr-2" /></div>
                  ) : patients.length === 0 ? (
                    <div className="flex flex-col items-center py-14 text-white/20"><Users className="h-8 w-8 mb-2" /><p>No patients found</p></div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      {patients.map((p: any) => {
                        const goal = p.ProteinGoalPerDay || 0;
                        const protein = Math.round(p.todayProtein);
                        const pct = goal > 0 ? Math.min(100, Math.round((protein / goal) * 100)) : 0;
                        const hitting = goal > 0 && protein >= goal * 0.9;
                        const isExpanded = expandedPatient === p.UserID;

                        return (
                          <div key={p.UserID}>
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 px-6 py-4 hover:bg-white/2 transition-colors">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                                  style={{ background: hitting ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 'linear-gradient(135deg, #f87171, #ef4444)' }}>
                                  {p.Username.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-white text-sm">{p.Username}</p>
                                    {hitting ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                                  </div>
                                  <p className="text-white/30 text-xs">{p.Email}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all"
                                        style={{ width: `${pct}%`, background: hitting ? 'linear-gradient(90deg, #4ade80, #22c55e)' : 'linear-gradient(90deg, #f87171, #ef4444)' }} />
                                    </div>
                                    <span className="text-xs text-white/30">{protein}g / {goal || '?'}g</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => setExpandedPatient(isExpanded ? null : p.UserID)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors border border-white/8">
                                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                  Notes
                                </button>
                                <Dialog open={openNoteModal === p.UserID} onOpenChange={open => { setOpenNoteModal(open ? p.UserID : null); setNoteBuffer(''); }}>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-xl text-xs">
                                      <ClipboardList className="w-3.5 h-3.5 mr-1.5" /> Write Note
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="border-white/10" style={{ background: '#0a0f1e' }}>
                                    <DialogHeader><DialogTitle className="text-white">Note for {p.Username}</DialogTitle></DialogHeader>
                                    <p className="text-sm text-white/40">Today: {protein}g protein ({pct}% of goal)</p>
                                    <Textarea value={noteBuffer} onChange={e => setNoteBuffer(e.target.value)}
                                      placeholder="Write personalized dietary advice, observations, or motivational guidance..."
                                      className="min-h-[130px] mt-3 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl" />
                                    <Button onClick={() => sendNoteMut.mutate(p.UserID)}
                                      disabled={!noteBuffer.trim() || sendNoteMut.isPending}
                                      className="mt-2 text-white w-full" style={{ background: 'linear-gradient(135deg, #22d3ee, #3b82f6)' }}>
                                      <Send className="w-4 h-4 mr-2" />
                                      {sendNoteMut.isPending ? 'Sending...' : 'Dispatch to Patient'}
                                    </Button>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>

                            {/* Expanded notes view */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                                  <div className="px-6 pb-4 pt-3 space-y-2"
                                    style={{ background: 'rgba(34,211,238,0.03)' }}>
                                    <p className="text-xs text-cyan-400/60 font-semibold uppercase tracking-widest mb-3">Notes History</p>
                                    {patientNotes.length === 0 ? (
                                      <p className="text-white/25 text-sm">No notes sent to this patient yet.</p>
                                    ) : patientNotes.map((n: any) => (
                                      <div key={n.NoteID} className="flex items-start justify-between gap-3 rounded-xl p-3 border"
                                        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                                        <div className="flex-1">
                                          <p className="text-white/80 text-sm">{n.Content}</p>
                                          <p className="text-white/25 text-xs mt-1">{new Date(n.CreatedAt).toLocaleString()}</p>
                                        </div>
                                        <button onClick={() => deleteNoteMut.mutate(n.NoteID)}
                                          className="text-white/20 hover:text-red-400 transition-colors shrink-0">
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── FOOD TAB ── */}
            {activeTab === 'food' && (
              <motion.div key="food" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Add Food form */}
                <div className="lg:col-span-2 rounded-2xl border p-6" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <h2 className="text-white font-bold text-lg mb-1">Add Food Item</h2>
                  <p className="text-white/30 text-sm mb-5">Inject new food into the global database</p>
                  <div className="space-y-3">
                    <div>
                      <label className={lClass}>Food Name *</label>
                      <Input value={food.name} onChange={e => setFood({ ...food, name: e.target.value })}
                        placeholder="e.g. Grilled Chicken Breast" className={iClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'protein', label: 'Protein (g) *', ph: '31' },
                        { key: 'calories', label: 'Calories (kcal)', ph: '165' },
                        { key: 'fat', label: 'Fat (g)', ph: '3.6' },
                        { key: 'carbs', label: 'Carbs (g)', ph: '0' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className={lClass}>{f.label}</label>
                          <Input type="number" min={0} placeholder={f.ph}
                            value={(food as any)[f.key]} onChange={e => setFood({ ...food, [f.key]: e.target.value })}
                            className={iClass} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className={lClass}>Category</label>
                      <Select value={food.category} onValueChange={v => setFood({ ...food, category: v })}>
                        <SelectTrigger className={iClass}><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-gray-950 border-white/10 text-white">
                          <SelectItem value="1">Vegetarian</SelectItem>
                          <SelectItem value="2">Non-Vegetarian</SelectItem>
                          <SelectItem value="3">Dairy</SelectItem>
                          <SelectItem value="4">Supplement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={() => addFoodMut.mutate()}
                      disabled={addFoodMut.isPending || !food.name.trim() || !food.protein}
                      className="w-full h-11 text-white font-bold rounded-xl mt-2"
                      style={{ background: 'linear-gradient(135deg, #22d3ee, #3b82f6)' }}>
                      {addFoodMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                      {addFoodMut.isPending ? 'Adding...' : 'Add to System'}
                    </Button>
                  </div>
                </div>

                {/* Food list */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input placeholder="Search system foods..." value={foodSearch} onChange={e => setFoodSearch(e.target.value)}
                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-10" />
                    </div>
                    <Select value={foodFilter} onValueChange={setFoodFilter}>
                      <SelectTrigger className="w-full sm:w-40 bg-white/5 border-white/10 text-white rounded-xl h-10">
                        <div className="flex items-center gap-2">
                          <FilterIcon className="h-3.5 w-3.5 opacity-40" />
                          <SelectValue placeholder="All types" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0f1e] border-white/10 text-white">
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="1">Vegetarian</SelectItem>
                        <SelectItem value="2">Non-Veg</SelectItem>
                        <SelectItem value="3">Dairy</SelectItem>
                        <SelectItem value="4">Supplements</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    {foodsLoading ? (
                      <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-white/30" /></div>
                    ) : (
                      <div className="max-h-[600px] overflow-y-auto p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <AnimatePresence mode="popLayout">
                            {foods.filter((f: any) => {
                              const m = f.FoodName?.toLowerCase().includes(foodSearch.toLowerCase());
                              const c = foodFilter === 'all' || f.CategoryID === parseInt(foodFilter);
                              return m && c;
                            }).map((f: any, i: number) => {
                              const cat = categoryMap[f.CategoryID] || { label: 'Other', color: '#6b7280', bg: 'rgba(255,255,255,0.05)' };
                              return (
                                <motion.div 
                                  layout
                                  key={f.FoodID} 
                                  initial={{ opacity: 0, scale: 0.95 }} 
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ delay: i * 0.01 }}
                                  className="group relative rounded-2xl border p-4 hover:bg-white/5 transition-all" 
                                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="pr-8">
                                      <p className="font-bold text-white text-base leading-tight">{f.FoodName}</p>
                                      <Badge className="mt-1.5 text-[10px] uppercase font-black tracking-widest px-2 py-0 h-5" style={{ background: cat.bg, color: cat.color }}>
                                        {cat.label}
                                      </Badge>
                                    </div>
                                    <button onClick={() => { if (window.confirm(`Delete "${f.FoodName}"?`)) deleteFoodMut.mutate(f.FoodID); }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 absolute top-2 right-2">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-white/3">
                                    <div className="text-center">
                                      <p className="text-[10px] text-white/30 uppercase tracking-tighter font-black">Protein</p>
                                      <p className="text-cyan-400 font-black">{f.ProteinPer100g}g</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-[10px] text-white/30 uppercase tracking-tighter font-black">Calories</p>
                                      <p className="text-white font-black">{Math.round(f.CaloriesPer100g) || 0}</p>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── NOTES LOG TAB ── */}
            {activeTab === 'notes' && (
              <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <h2 className="text-white font-bold text-lg">My Notes Log</h2>
                    <p className="text-white/30 text-sm mt-0.5">All advice notes you've dispatched — {myNotes.length} total</p>
                  </div>
                  {myNotes.length === 0 ? (
                    <div className="flex flex-col items-center py-14 text-white/20">
                      <MessageSquare className="h-8 w-8 mb-2" />
                      <p>No notes sent yet</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      {myNotes.map((n: any, i: number) => (
                        <motion.div key={n.NoteID} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                          className="flex items-start justify-between gap-4 px-6 py-4 hover:bg-white/2 transition-colors">
                          <div className="h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
                            style={{ background: 'linear-gradient(135deg, #22d3ee, #3b82f6)' }}>
                            {n.PatientName?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-white text-sm">{n.PatientName}</p>
                              <span className="text-white/30 text-xs">·</span>
                              <p className="text-white/30 text-xs">{n.PatientEmail}</p>
                            </div>
                            <p className="text-white/70 text-sm">{n.Content}</p>
                            <p className="text-white/25 text-xs mt-1">{new Date(n.CreatedAt).toLocaleString()}</p>
                          </div>
                          <button onClick={() => deleteNoteMut.mutate(n.NoteID)}
                            className="text-white/20 hover:text-red-400 transition-colors shrink-0 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
};

export default NutritionistDashboard;
