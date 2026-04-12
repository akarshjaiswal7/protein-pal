import { useState, useMemo } from 'react';
import { Search, Plus, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import AppNavbar from '@/components/AppNavbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockFoods, Food } from '@/lib/data';
import { cn } from '@/lib/utils';

const categories = ['All', 'Vegetarian', 'Non-Veg', 'Dairy', 'Supplement'] as const;

const categoryColors: Record<string, string> = {
  Vegetarian: 'bg-success/10 text-success border-success/20',
  'Non-Veg': 'bg-danger/10 text-danger border-danger/20',
  Dairy: 'bg-info/10 text-info border-info/20',
  Supplement: 'bg-warning/10 text-warning border-warning/20',
};

const FoodDatabase = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');

  const filtered = useMemo(
    () =>
      mockFoods.filter(
        f =>
          f.foodName.toLowerCase().includes(search.toLowerCase()) &&
          (category === 'All' || f.category === category)
      ),
    [search, category]
  );

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Food Database</h1>
              <p className="text-muted-foreground">{mockFoods.length} items available</p>
            </div>
            <Button className="gap-2 w-fit">
              <Plus className="h-4 w-4" /> Add Food
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search foods..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    category === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Food Name</TableHead>
                  <TableHead className="text-right">Protein/100g</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Calories</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Fat</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Carbs</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No foods found</TableCell></TableRow>
                ) : (
                  filtered.map(food => (
                    <TableRow key={food.foodId}>
                      <TableCell className="font-medium text-foreground">{food.foodName}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">{food.proteinPer100g}g</TableCell>
                      <TableCell className="text-right hidden sm:table-cell">{food.calories}</TableCell>
                      <TableCell className="text-right hidden md:table-cell">{food.fat}g</TableCell>
                      <TableCell className="text-right hidden md:table-cell">{food.carbs}g</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs', categoryColors[food.category])}>
                          {food.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default FoodDatabase;
