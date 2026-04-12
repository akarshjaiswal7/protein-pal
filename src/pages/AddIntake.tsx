import { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import AppNavbar from '@/components/AppNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockFoods, calculateProtein } from '@/lib/data';
import { toast } from 'sonner';

const AddIntake = () => {
  const [search, setSearch] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [mealType, setMealType] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const filteredFoods = useMemo(
    () => mockFoods.filter(f => f.foodName.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const selectedFood = mockFoods.find(f => f.foodId === selectedFoodId);
  const estimatedProtein = selectedFood && quantity
    ? calculateProtein(selectedFood.proteinPer100g, Number(quantity))
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFoodId || !quantity || !mealType) {
      toast.error('Please fill in all required fields');
      return;
    }
    toast.success(`Added ${selectedFood?.foodName} — ${Math.round(estimatedProtein)}g protein`);
    setSelectedFoodId('');
    setQuantity('');
    setMealType('');
    setTime('');
    setNotes('');
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="container max-w-2xl py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="mb-2 text-3xl font-bold text-foreground">Add Intake</h1>
          <p className="mb-8 text-muted-foreground">Log what you ate to track your protein</p>

          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
            {/* Food search */}
            <div>
              <Label>Food Item *</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search food..."
                  className="pl-10"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setSelectedFoodId(''); }}
                />
              </div>
              {search && !selectedFoodId && (
                <div className="mt-2 max-h-48 overflow-auto rounded-lg border bg-popover">
                  {filteredFoods.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">No results</p>
                  ) : (
                    filteredFoods.map(f => (
                      <button
                        key={f.foodId}
                        type="button"
                        onClick={() => { setSelectedFoodId(f.foodId); setSearch(f.foodName); }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                      >
                        <span className="font-medium text-foreground">{f.foodName}</span>
                        <span className="text-muted-foreground">{f.proteinPer100g}g/100g</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Quantity (grams) *</Label>
                <Input type="number" placeholder="e.g. 200" className="mt-1" value={quantity} onChange={e => setQuantity(e.target.value)} min={1} />
              </div>
              <div>
                <Label>Meal Type *</Label>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select meal" /></SelectTrigger>
                  <SelectContent>
                    {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Time</Label>
              <Input type="time" className="mt-1" value={time} onChange={e => setTime(e.target.value)} />
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea className="mt-1" placeholder="e.g. Grilled, with salad..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            {/* Protein preview */}
            {selectedFood && quantity && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-secondary p-4">
                <p className="text-sm font-medium text-secondary-foreground">Estimated Protein</p>
                <p className="text-3xl font-bold text-primary">{Math.round(estimatedProtein)}g</p>
                <p className="text-xs text-muted-foreground">
                  {selectedFood.foodName} · {quantity}g · {selectedFood.proteinPer100g}g per 100g
                </p>
              </motion.div>
            )}

            <Button type="submit" className="w-full gap-2">
              <Plus className="h-4 w-4" /> Log Intake
            </Button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default AddIntake;
