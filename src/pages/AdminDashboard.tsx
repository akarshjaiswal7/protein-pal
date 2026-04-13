import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Trash2, Users, Activity, AlertTriangle, Loader2, Utensils, TrendingUp, TrendingDown, BarChart2, Database, Filter as FilterIcon, Info } from 'lucide-react';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categoryMap: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Vegetarian', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
  2: { label: 'Non-Veg', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  3: { label: 'Dairy', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)' },
  4: { label: 'Supplement', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
};

const TAG_COLORS = ['#4ade80', '#f87171', '#22d3ee', '#fbbf24'];

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'foods' | 'flags'>('overview');
  const [foodSearch, setFoodSearch] = useState('');
  const [foodFilter, setFoodFilter] = useState<'all' | string>('all');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiFetch('/admin/dashboard'),
    refetchInterval: 30000,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => apiFetch('/admin/users'),
  });

  const { data: foods = [], isLoading: foodsLoading } = useQuery({
    queryKey: ['admin-foods'],
    queryFn: () => apiFetch('/admin/foods'),
  });

  const deleteUserMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/admin/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('User deleted'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteFoodMut = useMutation({
    mutationFn: (id: number) => apiFetch(`/admin/foods/${id}`, { method: 'DELETE' }),
    onSuccess: () => { toast.success('Food deleted'); queryClient.invalidateQueries({ queryKey: ['admin-foods'] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart2 },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'foods', label: 'Food DB', icon: Database },
    { key: 'flags', label: 'Flags', icon: AlertTriangle },
  ];

  const pieData = stats?.dietDistribution
    ? [
        { name: 'Vegetarian', value: Number(stats.dietDistribution.Vegetarian) || 0 },
        { name: 'Non-Veg', value: Number(stats.dietDistribution.NonVeg) || 0 },
        { name: 'Dairy', value: Number(stats.dietDistribution.Dairy) || 0 },
        { name: 'Supplement', value: Number(stats.dietDistribution.Supplement) || 0 },
      ].filter(d => d.value > 0)
    : [];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #060b18 0%, #0a111f 100%)' }}>
      <AppNavbar />
      <main className="container py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>

          {/* Header */}
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">Administrator Hub</h1>
              <p className="text-white/40 text-sm">Platform management & real-time insights</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 p-1 rounded-2xl w-fit border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.key ? 'text-white shadow' : 'text-white/30 hover:text-white/60'}`}
                  style={activeTab === tab.key ? { background: 'linear-gradient(135deg, #a855f7, #7c3aed)' } : {}}>
                  <Icon className="h-4 w-4" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === 'overview' && (
            statsLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-white/30 mr-3" /><span className="text-white/30">Loading stats...</span></div>
            ) : (
              <div className="space-y-6">
                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: '#a855f7' },
                    { label: 'Active Today', value: stats?.activeToday ?? 0, icon: Activity, color: '#4ade80', note: 'Logged at least 1 meal' },
                    { label: 'Avg Protein Today', value: `${stats?.avgProtein ?? 0}g`, icon: Utensils, color: '#22d3ee' },
                  ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className="rounded-2xl border p-5" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-white/50 text-sm">{s.label}</p>
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}18` }}>
                            <Icon className="h-4 w-4" style={{ color: s.color }} />
                          </div>
                        </div>
                        <p className="text-3xl font-black text-white">{s.value}</p>
                        {s.note && <p className="text-xs text-white/25 mt-1">{s.note}</p>}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Top Foods + Diet Chart */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border p-6" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-violet-400" /> Top 5 Foods</h3>
                    {stats?.topFoods?.length === 0 ? (
                      <p className="text-white/30 text-sm">No intake data yet.</p>
                    ) : stats?.topFoods?.map((f: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <span className="text-white/70 text-sm">{f.FoodName}</span>
                        <span className="text-violet-400 font-bold text-sm">{f.useCount} logs</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border p-6" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><BarChart2 className="h-4 w-4 text-violet-400" /> Diet Distribution</h3>
                    {pieData.length === 0 ? (
                      <p className="text-white/30 text-sm">No intake data yet.</p>
                    ) : (
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width={140} height={140}>
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                              {pieData.map((_, idx) => <Cell key={idx} fill={TAG_COLORS[idx % TAG_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#0d1424', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: 'white', fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 text-sm">
                          {pieData.map((d, i) => (
                            <div key={d.name} className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full" style={{ background: TAG_COLORS[i] }} />
                              <span className="text-white/60">{d.name}</span>
                              <span className="font-bold text-white ml-auto pl-4">{d.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {/* ── USERS TAB ── */}
          {activeTab === 'users' && (
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <h2 className="text-white font-bold text-lg">Registered Users</h2>
                <p className="text-white/30 text-sm mt-0.5">{users.length} total accounts</p>
              </div>
              {usersLoading ? (
                <div className="flex items-center justify-center py-14"><Loader2 className="h-5 w-5 animate-spin text-white/30 mr-2" /><span className="text-white/30">Loading...</span></div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center py-14 text-white/20"><Users className="h-8 w-8 mb-2" /><p>No users found</p></div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                  {users.map((u: any, i: number) => {
                    const pct = u.ProteinGoalPerDay > 0 ? Math.min(100, Math.round((u.todayProtein / u.ProteinGoalPerDay) * 100)) : 0;
                    return (
                      <motion.div key={u.UserID} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-white/2 transition-colors group">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
                          {u.Username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white">{u.Username}</p>
                          <p className="text-white/40 text-xs truncate">{u.Email}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 90 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171' }} />
                            </div>
                            <span className="text-xs text-white/30 shrink-0">{u.todayProtein}g / {u.ProteinGoalPerDay || '?'}g</span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                          onClick={() => { if (window.confirm(`Delete account for ${u.Username}?`)) deleteUserMut.mutate(u.UserID); }}>
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── FOODS TAB ── */}
          {activeTab === 'foods' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-2">
                <div>
                  <h2 className="text-white font-bold text-xl">Database Moderation</h2>
                  <p className="text-white/30 text-sm">{foods.length} items currently in system</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Database className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                    <Input 
                      placeholder="Search items..." 
                      value={foodSearch} 
                      onChange={e => setFoodSearch(e.target.value)}
                      className="pl-9 bg-white/5 border-white/10 text-white rounded-xl h-10"
                    />
                  </div>
                  <Select value={foodFilter} onValueChange={setFoodFilter}>
                    <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white rounded-xl h-10">
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
              </div>

              {foodsLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-white/30" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          className="group relative rounded-2xl border p-4 hover:bg-white/5 transition-all overflow-hidden" 
                          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                          <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="icon" variant="ghost"
                              className="h-8 w-8 text-red-400 hover:bg-red-500/10 rounded-lg"
                              onClick={() => { if (window.confirm(`Delete "${f.FoodName}"?`)) deleteFoodMut.mutate(f.FoodID); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex justify-between items-start mb-3 pr-8">
                            <div>
                              <p className="font-bold text-white text-base leading-tight">{f.FoodName}</p>
                              <Badge className="mt-1.5 text-[10px] uppercase font-black tracking-widest px-2 py-0 h-5" style={{ background: cat.bg, color: cat.color }}>
                                {cat.label}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-auto pt-3 border-t border-white/5">
                            <div className="text-center">
                              <p className="text-[10px] text-white/30 uppercase tracking-tighter font-black">Protein</p>
                              <p className="text-emerald-400 font-black">{f.ProteinPer100g}g</p>
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
              )}
            </div>
          )}

          {/* ── FLAGS TAB ── */}
          {activeTab === 'flags' && (
            <div className="space-y-6">
              {statsLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-white/30 mr-3" /></div>
              ) : (
                <>
                  <div className="rounded-2xl border p-6" style={{ background: 'rgba(248,113,113,0.04)', borderColor: 'rgba(248,113,113,0.15)' }}>
                    <h3 className="text-red-400 font-bold text-lg flex items-center gap-2 mb-4"><TrendingDown className="h-5 w-5" /> Low Protein Alert ({stats?.flaggedLow?.length || 0})</h3>
                    {stats?.flaggedLow?.length === 0 ? (
                      <p className="text-white/30 text-sm">No users flagged — great job! 🎉</p>
                    ) : stats?.flaggedLow?.map((u: any) => (
                      <div key={u.UserID} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <span className="text-white/70 text-sm">{u.Username} <span className="text-white/30">({u.Email})</span></span>
                        <span className="text-red-400 font-bold text-sm">{u.todayProtein}g / {Math.round(u.ProteinGoalPerDay)}g</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border p-6" style={{ background: 'rgba(251,191,36,0.04)', borderColor: 'rgba(251,191,36,0.15)' }}>
                    <h3 className="text-yellow-400 font-bold text-lg flex items-center gap-2 mb-4"><TrendingUp className="h-5 w-5" /> Exceeding Goal ({stats?.flaggedHigh?.length || 0})</h3>
                    {stats?.flaggedHigh?.length === 0 ? (
                      <p className="text-white/30 text-sm">No users exceeding their goal today.</p>
                    ) : stats?.flaggedHigh?.map((u: any) => (
                      <div key={u.UserID} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <span className="text-white/70 text-sm">{u.Username} <span className="text-white/30">({u.Email})</span></span>
                        <span className="text-yellow-400 font-bold text-sm">{u.todayProtein}g / {Math.round(u.ProteinGoalPerDay)}g</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;
