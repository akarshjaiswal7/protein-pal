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
}

export const calculateBMI = (weight: number, heightCm: number): BMIResult => {
  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  let category: BMIResult['category'];
  let color: string;

  if (bmi < 18.5) { category = 'Underweight'; color = 'warning'; }
  else if (bmi < 25) { category = 'Normal'; color = 'success'; }
  else if (bmi < 30) { category = 'Overweight'; color = 'warning'; }
  else { category = 'Obese'; color = 'danger'; }

  return { value: Math.round(bmi * 10) / 10, category, color };
};

export const calculateProteinGoal = (stats: UserStats): { min: number; max: number; recommended: number } => {
  const { weight, activityLevel, goal } = stats;

  let minMultiplier: number, maxMultiplier: number;

  switch (activityLevel) {
    case 'Sedentary': minMultiplier = 0.8; maxMultiplier = 1.0; break;
    case 'Light': minMultiplier = 1.0; maxMultiplier = 1.2; break;
    case 'Moderate': minMultiplier = 1.2; maxMultiplier = 1.5; break;
    case 'Active': minMultiplier = 1.5; maxMultiplier = 1.8; break;
    case 'Very Active': minMultiplier = 1.8; maxMultiplier = 2.0; break;
    default: minMultiplier = 1.0; maxMultiplier = 1.2;
  }

  // Adjust for goal
  if (goal === 'Weight Loss') {
    minMultiplier += 0.2;
    maxMultiplier += 0.2;
  } else if (goal === 'Muscle Gain') {
    minMultiplier += 0.1;
    maxMultiplier += 0.1;
  }

  const min = Math.round(weight * minMultiplier);
  const max = Math.round(weight * maxMultiplier);
  const recommended = Math.round((min + max) / 2);

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
    return true; // Non-Vegetarian gets all
  });
};

const pickRandom = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const buildMeal = (foods: Food[], targetProtein: number): MealItem[] => {
  const items: MealItem[] = [];
  let remaining = targetProtein;

  const selected = pickRandom(foods, 3);
  for (const food of selected) {
    if (remaining <= 0) break;
    // Calculate quantity needed, cap at reasonable amounts
    const maxQty = food.category === 'Supplement' ? 50 : 300;
    const neededQty = Math.min(maxQty, Math.round((remaining / food.proteinPer100g) * 100));
    const qty = Math.max(30, Math.min(neededQty, maxQty));
    const protein = Math.round((food.proteinPer100g / 100) * qty * 10) / 10;
    items.push({ food, quantity: qty, protein });
    remaining -= protein;
  }

  return items;
};

export const generateMealPlans = (proteinGoal: number, diet: DietType): MealPlan[] => {
  const foods = filterFoodsByDiet(diet);
  const plans: MealPlan[] = [];

  for (let i = 0; i < 3; i++) {
    const breakfastTarget = proteinGoal * 0.25;
    const lunchTarget = proteinGoal * 0.35;
    const dinnerTarget = proteinGoal * 0.3;
    const snackTarget = proteinGoal * 0.1;

    const meals = [
      { type: 'Breakfast', items: buildMeal(foods, breakfastTarget) },
      { type: 'Lunch', items: buildMeal(foods, lunchTarget) },
      { type: 'Dinner', items: buildMeal(foods, dinnerTarget) },
      { type: 'Snack', items: buildMeal(foods, snackTarget) },
    ];

    const totalProtein = Math.round(meals.reduce((sum, m) => sum + m.items.reduce((s, item) => s + item.protein, 0), 0));

    plans.push({
      id: i + 1,
      label: `Option ${i + 1}`,
      meals,
      totalProtein,
      isRecommended: false,
    });
  }

  // Mark the plan closest to goal as recommended
  plans.sort((a, b) => Math.abs(a.totalProtein - proteinGoal) - Math.abs(b.totalProtein - proteinGoal));
  plans[0].isRecommended = true;
  // Re-sort by id
  plans.sort((a, b) => a.id - b.id);

  return plans;
};
