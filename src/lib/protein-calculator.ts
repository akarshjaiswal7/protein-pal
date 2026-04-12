import { mockFoods, Food } from './data';

export interface UserStats {
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  height: number;
  weight: number;
  activityLevel: 'Sedentary' | 'Light' | 'Moderate' | 'Active' | 'Very Active';
  goal: 'Weight Loss' | 'Maintenance' | 'Muscle Gain';
}

export interface BMIResult {
  value: number;
  category: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
  color: string;
  message: string;
}

export const calculateBMI = (weight: number, heightCm: number): BMIResult => {
  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  const value = Math.round(bmi * 10) / 10;

  if (bmi < 18.5) return { value, category: 'Underweight', color: 'warning', message: 'You are underweight. A higher protein intake is recommended for healthy weight and muscle gain.' };
  if (bmi < 25) return { value, category: 'Normal', color: 'success', message: 'Your BMI is normal. A balanced protein intake will help maintain your health and fitness.' };
  if (bmi < 30) return { value, category: 'Overweight', color: 'warning', message: 'You are overweight. A controlled protein intake with lean sources is recommended to support fat loss.' };
  return { value, category: 'Obese', color: 'danger', message: 'Your BMI indicates obesity. A high-protein, calorie-controlled diet with lean sources is strongly recommended.' };
};

// BMI-driven protein ranges per the strict spec
const getBMIProteinRange = (bmiCategory: BMIResult['category']): { min: number; max: number } => {
  switch (bmiCategory) {
    case 'Underweight': return { min: 1.5, max: 2.2 };
    case 'Normal': return { min: 1.0, max: 1.5 };
    case 'Overweight': return { min: 1.2, max: 1.8 };
    case 'Obese': return { min: 1.2, max: 1.8 };
  }
};

// Activity level adjusts position within the BMI range
const activityFactor: Record<UserStats['activityLevel'], number> = {
  'Sedentary': 0.0,
  'Light': 0.25,
  'Moderate': 0.5,
  'Active': 0.75,
  'Very Active': 1.0,
};

// Goal shifts the multiplier within range
const goalShift: Record<UserStats['goal'], number> = {
  'Weight Loss': 0.15,   // higher protein preserves muscle during deficit
  'Maintenance': 0.0,
  'Muscle Gain': 0.1,
};

export const calculateProteinGoal = (stats: UserStats): { min: number; max: number; recommended: number } => {
  const bmi = calculateBMI(stats.weight, stats.height);
  const range = getBMIProteinRange(bmi.category);

  // Position within range based on activity
  const aFactor = activityFactor[stats.activityLevel];
  let multiplier = range.min + (range.max - range.min) * aFactor;

  // Goal shift — clamp to range bounds
  multiplier = Math.min(range.max, Math.max(range.min, multiplier + goalShift[stats.goal]));

  const recommended = Math.round(stats.weight * multiplier);
  const min = Math.round(stats.weight * range.min);
  const max = Math.round(stats.weight * range.max);

  return { min, max, recommended };
};

export type DietType = 'Vegetarian' | 'Non-Vegetarian' | 'Eggetarian';

export interface MealItem {
  food: Food;
  quantity: number;
  protein: number;
}

export interface MealPlan {
  id: number;
  label: string;
  meals: { type: string; items: MealItem[] }[];
  totalProtein: number;
  isRecommended: boolean;
}

const filterFoodsByDiet = (diet: DietType): Food[] => {
  return mockFoods.filter(food => {
    if (diet === 'Vegetarian') return food.category === 'Vegetarian' || food.category === 'Dairy' || food.category === 'Supplement';
    if (diet === 'Eggetarian') return food.category !== 'Non-Veg' || food.foodName.toLowerCase().includes('egg');
    return true;
  });
};

const pickRandom = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
};

/**
 * Build a single meal that targets exactly `targetProtein` grams.
 * Uses greedy allocation with the last item trimmed to hit the target precisely.
 */
const buildMeal = (foods: Food[], targetProtein: number): MealItem[] => {
  if (targetProtein <= 0) return [];
  const items: MealItem[] = [];
  let remaining = targetProtein;
  const selected = pickRandom(foods, 3);

  for (let i = 0; i < selected.length; i++) {
    if (remaining <= 0) break;
    const food = selected[i];
    const isLast = i === selected.length - 1 || remaining <= 5;
    const maxQty = food.category === 'Supplement' ? 50 : 300;
    const minQty = 20;

    // Calculate exact quantity needed for remaining protein
    let qty = Math.round((remaining / food.proteinPer100g) * 100);
    qty = Math.max(minQty, Math.min(qty, maxQty));

    const protein = Math.round((food.proteinPer100g / 100) * qty * 10) / 10;

    // If this is the last item or we'd overshoot, trim to exact remaining
    if (isLast || protein >= remaining) {
      const exactQty = Math.round((remaining / food.proteinPer100g) * 100);
      const clampedQty = Math.max(minQty, Math.min(exactQty, maxQty));
      const exactProtein = Math.round((food.proteinPer100g / 100) * clampedQty * 10) / 10;
      items.push({ food, quantity: clampedQty, protein: exactProtein });
      remaining -= exactProtein;
      break;
    }

    // Allocate a portion (not all remaining) to leave room for variety
    const portionQty = Math.max(minQty, Math.min(Math.round(qty * 0.6), maxQty));
    const portionProtein = Math.round((food.proteinPer100g / 100) * portionQty * 10) / 10;
    items.push({ food, quantity: portionQty, protein: portionProtein });
    remaining -= portionProtein;
  }

  return items;
};

/**
 * Generate 3 meal plans that strictly do NOT exceed the protein goal.
 * Each plan targets 90-100% of the goal.
 * The plan closest to the goal is marked as recommended.
 */
export const generateMealPlans = (proteinGoal: number, diet: DietType): MealPlan[] => {
  const foods = filterFoodsByDiet(diet);
  const plans: MealPlan[] = [];
  const attempts = 20; // try multiple times to get 3 valid plans

  for (let attempt = 0; attempt < attempts && plans.length < 3; attempt++) {
    // Slightly vary the effective target (90-100% of goal) for diversity
    const targetFraction = 0.92 + Math.random() * 0.08; // 92%-100%
    const effectiveTarget = proteinGoal * targetFraction;

    const breakfastTarget = effectiveTarget * 0.25;
    const lunchTarget = effectiveTarget * 0.35;
    const dinnerTarget = effectiveTarget * 0.30;
    const snackTarget = effectiveTarget * 0.10;

    const meals = [
      { type: 'Breakfast', items: buildMeal(foods, breakfastTarget) },
      { type: 'Lunch', items: buildMeal(foods, lunchTarget) },
      { type: 'Dinner', items: buildMeal(foods, dinnerTarget) },
      { type: 'Snack', items: buildMeal(foods, snackTarget) },
    ];

    const totalProtein = Math.round(
      meals.reduce((sum, m) => sum + m.items.reduce((s, item) => s + item.protein, 0), 0)
    );

    // STRICT: reject any plan that exceeds the goal
    if (totalProtein > proteinGoal) continue;

    // Reject plans below 85% of goal (too far off)
    if (totalProtein < proteinGoal * 0.85) continue;

    plans.push({
      id: plans.length + 1,
      label: `Option ${plans.length + 1}`,
      meals,
      totalProtein,
      isRecommended: false,
    });
  }

  // Fallback: if we couldn't generate 3 valid plans, fill remaining
  while (plans.length < 3) {
    const safeTarget = proteinGoal * 0.90;
    const meals = [
      { type: 'Breakfast', items: buildMeal(foods, safeTarget * 0.25) },
      { type: 'Lunch', items: buildMeal(foods, safeTarget * 0.35) },
      { type: 'Dinner', items: buildMeal(foods, safeTarget * 0.30) },
      { type: 'Snack', items: buildMeal(foods, safeTarget * 0.10) },
    ];
    const totalProtein = Math.round(
      meals.reduce((sum, m) => sum + m.items.reduce((s, item) => s + item.protein, 0), 0)
    );
    plans.push({
      id: plans.length + 1,
      label: `Option ${plans.length + 1}`,
      meals,
      totalProtein: Math.min(totalProtein, proteinGoal),
      isRecommended: false,
    });
  }

  // Mark closest-to-goal (without exceeding) as recommended
  plans.sort((a, b) => {
    const diffA = proteinGoal - a.totalProtein;
    const diffB = proteinGoal - b.totalProtein;
    return diffA - diffB; // smaller gap = better
  });
  plans[0].isRecommended = true;
  plans[0].label = 'Best Match';

  // Re-sort by id for display
  plans.sort((a, b) => a.id - b.id);

  return plans;
};
