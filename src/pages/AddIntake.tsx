import { useState, useMemo } from 'react';
import { Search, Plus, Loader2, Utensils, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const AddIntake = () => {
  const { userId } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [mealType, setMealType] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: foods = [] } = useQuery({
    queryKey: ['foods'],
    queryFn: () => apiFetch('/foods'),
  });

  const filteredFoods = useMemo(
    () => foods.filter((f: any) => f.FoodName?.toLowerCase().includes(search.toLowerCase())),
    [search, foods]
  );

  const selectedFood = foods.find((f: any) => f.FoodID?.toString() === selectedFoodId);
  const estimatedProtein = selectedFood && quantity
    ? (selectedFood.ProteinPer100g / 100) * Number(quantity)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFoodId) { toast.error('Please select a food item'); return; }
    if (!quantity || Number(quantity) <= 0) { toast.error('Please enter a valid quantity (must be > 0)'); return; }
    if (!mealType) { toast.error('Please select a meal type'); return; }

    // Validate time format HH:MM:SS if provided
    let formattedTime: string | null = null;
    if (time) {
      // Input type="time" gives HH:MM — we append :00 for HH:MM:SS
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(time)) {
        toast.error('Time must be in HH:MM format (24-hour)');
        return;
      }
      formattedTime = `${time}:00`; // Store as HH:MM:SS
    }

    setLoading(true);
    try {
      await apiFetch('/intake/add-intake', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          foodId: selectedFoodId,
          quantityInGrams: Number(quantity),
          intakeDate: new Date().toISOString().split('T')[0],
          intakeTime: formattedTime,
          mealType,
        }),
      });
      toast.success(`Logged ${selectedFood?.FoodName} — ${Math.round(estimatedProtein)}g protein 💪`);
      setSelectedFoodId('');
      setQuantity('');
      setMealType('');
      setTime('');
      setSearch('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add intake');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-11 focus:border-emerald-500/40";
  const labelClass = "text-white/50 text-xs uppercase tracking-widest font-semibold";

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #060b18 0%, #0a111f 100%)' }}>
      <AppNavbar />
      <main className="container max-w-xl py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight mb-1">Log Meal</h1>
            <p className="text-white/40">Track what you ate to hit your protein goal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border p-7"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>

            {/* Food search */}
            <div>
              <Label className={labelClass}>Food Item *</Label>
              <div className="relative mt-1.5">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <Input placeholder="Search food database..."
                  className={`pl-10 ${inputClass}`}
                  value={search}
                  onChange={e => { setSearch(e.target.value); setSelectedFoodId(''); }}
                />
              </div>
              {search && !selectedFoodId && (
                <div className="mt-2 max-h-52 overflow-auto rounded-xl border"
                  style={{ background: 'rgba(10,14,26,0.98)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  {filteredFoods.length === 0 ? (
                    <p className="p-4 text-sm text-white/30 text-center">No foods found</p>
                  ) : filteredFoods.map((f: any) => (
                    <button key={f.FoodID} type="button"
                      onClick={() => { setSelectedFoodId(f.FoodID.toString()); setSearch(f.FoodName); }}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors border-b last:border-0"
                      style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <span className="font-medium text-white">{f.FoodName}</span>
                      <span className="text-white/40 text-xs">{f.ProteinPer100g}g protein/100g</span>
                    </button>
                  ))}
                </div>
              )}
              {selectedFood && <p className="mt-1.5 text-xs text-emerald-400">✓ {selectedFood.FoodName} selected</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className={labelClass}>Quantity (grams) *</Label>
                <Input type="number" placeholder="e.g. 200"
                  className={`mt-1.5 ${inputClass}`}
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  min={1} />
              </div>
              <div>
                <Label className={labelClass}>Meal Type *</Label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger className={`mt-1.5 ${inputClass}`}><SelectValue placeholder="Select meal" /></SelectTrigger>
                  <SelectContent className="bg-gray-950 border-white/10 text-white">
                    {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Time with format hint */}
            <div>
              <Label className={labelClass}>Time of Meal</Label>
              <div className="relative mt-1.5">
                <Clock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30 pointer-events-none" />
                <Input type="time"
                  className={`pl-10 ${inputClass}`}
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
              <p className="text-xs text-white/25 mt-1.5">
                24-hour format (HH:MM) — stored as HH:MM:SS. Leave blank if unknown.
              </p>
            </div>

            {/* Protein preview */}
            {selectedFood && quantity && Number(quantity) > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-5 text-center border"
                style={{ background: 'rgba(74,222,128,0.06)', borderColor: 'rgba(74,222,128,0.15)' }}>
                <p className="text-sm text-emerald-400/60 mb-1">Estimated Protein</p>
                <p className="text-4xl font-black text-emerald-400">{Math.round(estimatedProtein)}g</p>
                <p className="text-xs text-white/30 mt-1">
                  {selectedFood.FoodName} · {quantity}g · {selectedFood.ProteinPer100g}g per 100g
                </p>
              </motion.div>
            )}

            <Button type="submit"
              className="w-full h-12 rounded-xl text-base font-bold text-black mt-2 hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #4ade80, #22c55e)' }} disabled={loading}>
              {loading
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Logging...</>
                : <><Utensils className="h-4 w-4 mr-2" />Log Intake</>}
            </Button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default AddIntake;
