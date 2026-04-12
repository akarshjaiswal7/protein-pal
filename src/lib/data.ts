// Mock data for the protein tracker

export interface User {
  userId: string;
  username: string;
  email: string;
  age: number;
  weight: number;
  gender: string;
  activityLevel: string;
  proteinGoalPerDay: number;
  goal: string;
  preference: string;
  avatar?: string;
}

export interface Food {
  foodId: string;
  foodName: string;
  proteinPer100g: number;
  calories: number;
  fat: number;
  carbs: number;
  category: 'Vegetarian' | 'Non-Veg' | 'Dairy' | 'Supplement';
}

export interface Intake {
  intakeId: string;
  userId: string;
  foodId: string;
  quantityInGrams: number;
  intakeDate: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  time: string;
  notes?: string;
}

export const mockUser: User = {
  userId: '1',
  username: 'Alex Johnson',
  email: 'alex@example.com',
  age: 28,
  weight: 75,
  gender: 'Male',
  activityLevel: 'Moderately Active',
  proteinGoalPerDay: 150,
  goal: 'Muscle Gain',
  preference: 'Non-Veg',
};

export const mockFoods: Food[] = [
  { foodId: '1', foodName: 'Chicken Breast', proteinPer100g: 31, calories: 165, fat: 3.6, carbs: 0, category: 'Non-Veg' },
  { foodId: '2', foodName: 'Eggs (Whole)', proteinPer100g: 13, calories: 155, fat: 11, carbs: 1.1, category: 'Non-Veg' },
  { foodId: '3', foodName: 'Greek Yogurt', proteinPer100g: 10, calories: 59, fat: 0.4, carbs: 3.6, category: 'Dairy' },
  { foodId: '4', foodName: 'Paneer', proteinPer100g: 18, calories: 265, fat: 20, carbs: 1.2, category: 'Vegetarian' },
  { foodId: '5', foodName: 'Whey Protein', proteinPer100g: 80, calories: 400, fat: 5, carbs: 10, category: 'Supplement' },
  { foodId: '6', foodName: 'Lentils (Dal)', proteinPer100g: 9, calories: 116, fat: 0.4, carbs: 20, category: 'Vegetarian' },
  { foodId: '7', foodName: 'Salmon', proteinPer100g: 25, calories: 208, fat: 13, carbs: 0, category: 'Non-Veg' },
  { foodId: '8', foodName: 'Tofu', proteinPer100g: 8, calories: 76, fat: 4.8, carbs: 1.9, category: 'Vegetarian' },
  { foodId: '9', foodName: 'Cottage Cheese', proteinPer100g: 11, calories: 98, fat: 4.3, carbs: 3.4, category: 'Dairy' },
  { foodId: '10', foodName: 'Almonds', proteinPer100g: 21, calories: 579, fat: 49, carbs: 22, category: 'Vegetarian' },
  { foodId: '11', foodName: 'Tuna', proteinPer100g: 29, calories: 132, fat: 1.3, carbs: 0, category: 'Non-Veg' },
  { foodId: '12', foodName: 'Milk (Whole)', proteinPer100g: 3.4, calories: 61, fat: 3.3, carbs: 4.8, category: 'Dairy' },
];

export const mockIntakes: Intake[] = [
  { intakeId: '1', userId: '1', foodId: '1', quantityInGrams: 200, intakeDate: new Date().toISOString().split('T')[0], mealType: 'Lunch', time: '12:30', notes: 'Grilled' },
  { intakeId: '2', userId: '1', foodId: '2', quantityInGrams: 150, intakeDate: new Date().toISOString().split('T')[0], mealType: 'Breakfast', time: '08:00' },
  { intakeId: '3', userId: '1', foodId: '5', quantityInGrams: 30, intakeDate: new Date().toISOString().split('T')[0], mealType: 'Snack', time: '16:00', notes: 'Post workout' },
  { intakeId: '4', userId: '1', foodId: '3', quantityInGrams: 200, intakeDate: new Date().toISOString().split('T')[0], mealType: 'Snack', time: '10:00' },
];

// Generate weekly data
export const generateWeeklyData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    protein: Math.floor(Math.random() * 80) + 80,
    goal: 150,
  }));
};

export const calculateProtein = (proteinPer100g: number, quantityGrams: number) => {
  return (proteinPer100g / 100) * quantityGrams;
};

export const getProteinStatus = (consumed: number, goal: number): { label: string; color: string } => {
  const pct = (consumed / goal) * 100;
  if (pct < 70) return { label: 'Deficient', color: 'danger' };
  if (pct <= 110) return { label: 'Adequate', color: 'success' };
  return { label: 'Excess', color: 'warning' };
};
