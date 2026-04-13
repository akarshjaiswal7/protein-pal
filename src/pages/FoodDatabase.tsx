import { useState, useMemo } from 'react';
import { Search, Database, Loader2, Filter, Utensils, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import AppNavbar from '@/components/AppNavbar';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const categoryMap: Record<number, { label: string; color: string; bg: string; icon: string }> = {
  1: { label: 'Vegetarian', color: '#4ade80', bg: 'rgba(74,222,128,0.1)', icon: '🥗' },
  2: { label: 'Non-Veg', color: '#f87171', bg: 'rgba(248,113,113,0.1)', icon: '🍗' },
  3: { label: 'Dairy', color: '#22d3ee', bg: 'rgba(34,211,238,0.1)', icon: '🧀' },
  4: { label: 'Supplement', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', icon: '💊' },
};

const FoodDatabase = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');

  const { data: foods = [], isLoading } = useQuery({
    queryKey: ['foods'],
    queryFn: () => apiFetch('/foods'),
  });

  const filtered = useMemo(() => {
    return foods.filter((f: any) => {
      const matchesSearch = f.FoodName?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || f.CategoryID === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, foods, selectedCategory]);

  const categories = [
    { id: 'all', label: 'All Foods' },
    ...Object.entries(categoryMap).map(([id, cat]) => ({ id: parseInt(id), label: cat.label }))
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #060b18 0%, #0a111f 100%)' }}>
      <AppNavbar />
      <main className="container py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          
          <div className="mb-10 text-center sm:text-left">
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Nutrition Library</h1>
            <p className="text-white/40 text-lg">Browse our verified database of high-protein foods</p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-6 mb-12 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/20" />
              <Input 
                placeholder="Find chicken, whey, lentils..."
                className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-2xl h-14 text-lg focus:border-emerald-500/40 focus:ring-emerald-500/10 transition-all"
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white/3 border border-white/5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                    selectedCategory === cat.id 
                      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" 
                      : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
              <p className="text-white/30 font-medium">Indexing nutritional data...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-32 text-center rounded-[2.5rem] border-2 border-dashed border-white/5 bg-white/[0.01]">
              <Database className="h-16 w-16 mb-4 text-white/10" />
              <h3 className="text-white font-bold text-xl">No ingredients found</h3>
              <p className="text-white/30 max-w-xs mt-2">Try adjusting your search or category filter to find what you're looking for.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {filtered.map((food: any, i: number) => {
                  const cat = categoryMap[food.CategoryID] || { label: 'Other', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: '🍱' };
                  return (
                    <motion.div
                      layout
                      key={food.FoodID}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: Math.min(i * 0.03, 0.4) }}
                      className="group relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative h-full flex flex-col p-6 rounded-[2rem] border border-white/10 bg-white/3 backdrop-blur-sm group-hover:border-emerald-500/30 group-hover:bg-white/5 transition-all duration-300">
                        
                        <div className="flex items-start justify-between mb-6">
                          <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl shadow-inner border border-white/5">
                            {cat.icon}
                          </div>
                          <Badge className="font-bold border-none" style={{ background: cat.bg, color: cat.color }}>
                            {cat.label}
                          </Badge>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1 leading-tight group-hover:text-emerald-400 transition-colors">
                            {food.FoodName}
                          </h3>
                          <p className="text-white/30 text-xs uppercase tracking-widest font-black mb-4">Per 100g portion</p>
                          
                          <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/10">
                              <p className="text-[10px] uppercase tracking-tighter text-emerald-500/80 font-black">Protein</p>
                              <p className="text-xl font-black text-emerald-400">{food.ProteinPer100g}g</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                              <p className="text-[10px] uppercase tracking-tighter text-white/30 font-black">Energy</p>
                              <p className="text-xl font-black text-white/80">{Math.round(food.CaloriesPer100g) || '—'} <span className="text-[10px] font-medium text-white/20">kcal</span></p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5 text-[10px] font-black uppercase tracking-widest text-white/20">
                          <div className="flex gap-3">
                            <span>F: {food.FatPer100g || 0}g</span>
                            <span>C: {food.CarbsPer100g || 0}g</span>
                          </div>
                          <div className="flex gap-1">
                             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/30" />
                             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/30" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default FoodDatabase;
