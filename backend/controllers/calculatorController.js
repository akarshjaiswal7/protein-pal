const db = require('../db');

exports.calculateGoal = (req, res) => {
  try {
    const { height, weight, activityLevel, goalType } = req.body;

    if (!height || !weight) {
      return res.status(400).json({ error: 'Height and weight are required' });
    }

    // BMI = weight / (height/100)^2
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    let category = '';
    let minMultiplier = 1.0;
    let maxMultiplier = 1.5;

    if (bmi < 18.5) {
      category = 'Underweight';
      // Underweight → 1.5–2.2 g/kg (gain weight)
      minMultiplier = 1.5;
      maxMultiplier = 2.2;
    } else if (bmi >= 18.5 && bmi < 25) {
      category = 'Normal';
      // Normal → 1.0–1.5 g/kg
      minMultiplier = 1.0;
      maxMultiplier = 1.5;
    } else {
      category = 'Overweight';
      // Overweight → 1.2–1.8 g/kg (fat loss)
      minMultiplier = 1.2;
      maxMultiplier = 1.8;
    }

    // Adjust based on activityLevel (assuming 1 is sedentary, 2 is moderate, 3 is active)
    let suggestedProtein = weight * ((minMultiplier + maxMultiplier) / 2);
    // Rough adjustment based on params
    if (activityLevel >= 3) suggestedProtein *= 1.1;
    // For Weight Loss (Deficit), protein needs are typically higher to preserve muscle mass
    if (goalType === 'Weight Loss') suggestedProtein *= 1.1; 
    // For Muscle Gain (Surplus), protein is important but calories do the heavy lifting, so multiplier can stay normal or slightly bumped
    if (goalType === 'Muscle Gain') suggestedProtein *= 1.05; 
    
    res.json({
      bmi: parseFloat(bmi.toFixed(2)),
      category,
      suggestedProtein: parseFloat(suggestedProtein.toFixed(2)),
      range: `${(weight * minMultiplier).toFixed(1)} - ${(weight * maxMultiplier).toFixed(1)} g`
    });

  } catch (err) {
    console.error('Calculate Goal Error:', err);
    res.status(500).json({ error: 'Failed to calculate goal' });
  }
};

exports.generateMealPlan = async (req, res) => {
  try {
    let { proteinGoal, dietType } = req.body;
    
    if (!proteinGoal || proteinGoal <= 0) {
      return res.status(400).json({ error: 'proteinGoal must be a positive number' });
    }

    // Query available foods. We'll ignore dietType for simplicity if category mapping isn't strict,
    // but in a real app would map dietType ('veg', 'non-veg') to CategoryID or flags.
    const [foods] = await db.query('SELECT * FROM food_final WHERE ProteinPer100g > 0');
    
    if (foods.length === 0) {
      return res.status(404).json({ error: 'No food data available to generate plan' });
    }

    const generateOption = () => {
      let currentProtein = 0;
      let optionFoods = [];
      let attempts = 0;
      
      // Target is 90% to 100% of proteinGoal
      const targetMin = proteinGoal * 0.90;
      const targetMax = proteinGoal;
      
      // Shuffle foods array
      const shuffledFoods = [...foods].sort(() => 0.5 - Math.random());
      
      for (const food of shuffledFoods) {
        // Find a random quantity between 50g and 300g (multiples of 50)
        const qtyGrams = (Math.floor(Math.random() * 5) + 1) * 50; 
        const proteinContribution = (food.ProteinPer100g / 100) * qtyGrams;
        
        if (currentProtein + proteinContribution <= targetMax) {
          currentProtein += proteinContribution;
          optionFoods.push({
            foodName: food.FoodName,
            quantity: qtyGrams,
            protein: parseFloat(proteinContribution.toFixed(2))
          });
        }
        
        if (currentProtein >= targetMin) {
          break; // Stop if we hit the sweet spot
        }
      }
      
      return {
        foods: optionFoods,
        totalProtein: parseFloat(currentProtein.toFixed(2)),
        recommended: currentProtein >= targetMin
      };
    };

    const mealPlans = [];
    for (let i = 1; i <= 3; i++) {
        const option = generateOption();
        mealPlans.push({
            option: i,
            ...option
        });
    }

    res.json(mealPlans);

  } catch (err) {
    console.error('Generate Meal Plan Error:', err);
    res.status(500).json({ error: 'Failed to generate meal plan' });
  }
};
