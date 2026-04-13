const db = require('../db');
const logger = require('../utils/logger');

// ─── SAVE MEAL PLAN ──────────────────────────────────────────────────────────
exports.saveMealPlan = async (req, res) => {
  const { userId, planData, totalProtein, isCustom, planName } = req.body;
  logger.info(`Saving meal plan for UserID: ${userId}${isCustom ? ' (Custom)' : ''}`);

  try {
    if (!userId || !planData || totalProtein === undefined) {
      return res.status(400).json({ error: 'Missing required fields: userId, planData, or totalProtein' });
    }

    if (!Array.isArray(planData)) {
      return res.status(400).json({ error: 'planData must be an array of food items' });
    }

    const [result] = await db.query(
      `INSERT INTO meal_plans (UserID, PlanData, TotalProtein, IsCustom, PlanName)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, JSON.stringify(planData), totalProtein, isCustom || false, planName || null]
    );

    logger.info(`Meal plan saved: ID ${result.insertId}`);
    res.status(201).json({ message: 'Plan saved successfully', planId: result.insertId });
  } catch (err) {
    logger.error(`Save Meal Plan Error: ${err.message}`);
    res.status(500).json({ error: 'Database error while saving plan' });
  }
};

// ─── GET LATEST MEAL PLAN ───────────────────────────────────────────────────
exports.getLatestPlan = async (req, res) => {
  const { userId } = req.params;
  try {
    const [plans] = await db.query(
      `SELECT * FROM meal_plans WHERE UserID = ? ORDER BY CreatedAt DESC LIMIT 1`,
      [userId]
    );
    res.json(plans.length > 0 ? plans[0] : null);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve active plan' });
  }
};

// ─── GET PLAN HISTORY ────────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  const { userId } = req.params;
  try {
    const [history] = await db.query(
      `SELECT PlanID, PlanName, TotalProtein, IsCustom, CreatedAt 
       FROM meal_plans WHERE UserID = ? ORDER BY CreatedAt DESC`,
      [userId]
    );
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve history' });
  }
};

// ─── GET SPECIFIC PLAN ───────────────────────────────────────────────────────
exports.getPlanById = async (req, res) => {
  const { planId } = req.params;
  try {
    const [plans] = await db.query('SELECT * FROM meal_plans WHERE PlanID = ?', [planId]);
    if (plans.length === 0) return res.status(404).json({ error: 'Plan not found' });
    res.json(plans[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve plan details' });
  }
};

// ─── LOG FULL PLAN (ONE-CLICK LOG) ──────────────────────────────────────────
exports.logFullPlan = async (req, res) => {
  const { planId } = req.params;
  const today = new Date().toISOString().split('T')[0];
  const time = new Date().toLocaleTimeString('it-IT').slice(0, 5); 

  logger.info(`Processing Batch Log for Plan ID: ${planId}`);

  try {
    const [plans] = await db.query('SELECT * FROM meal_plans WHERE PlanID = ?', [planId]);
    if (plans.length === 0) return res.status(404).json({ error: 'Plan not found' });

    const plan = plans[0];
    const targetUserId = plan.UserID || plan.userId; // Safety for case differences
    const items = typeof plan.PlanData === 'string' ? JSON.parse(plan.PlanData) : plan.PlanData;

    if (!Array.isArray(items)) {
      throw new Error('PlanData is not a valid array');
    }

    for (const item of items) {
      let foodId = item.foodId;
      // Resolve foodId if missing
      if (!foodId && item.foodName) {
        const [foods] = await db.query('SELECT FoodID FROM food_final WHERE FoodName = ? LIMIT 1', [item.foodName]);
        if (foods.length > 0) foodId = foods[0].FoodID;
      }

      if (foodId) {
        // Strict Numeric Safety: Ensure quantity is a valid decimal and within range
        const qty = Math.min(9999, Math.max(0, parseFloat(item.quantity) || 0));
        
        if (qty > 0) {
          // Use 'Snack' as the safest standard category to avoid Enum truncation errors
          await db.query(
            `INSERT INTO intake_final (UserID, FoodID, QuantityInGrams, IntakeDate, IntakeTime, MealType)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [targetUserId, foodId, qty, today, time, 'Snack']
          );
        }
      }
    }

    res.json({ message: 'Nutrition strategy successfully logged for today!' });
  } catch (err) {
    logger.error(`Batch Log Error: ${err.message}`);
    res.status(500).json({ 
      error: 'Failed to process batch log. Ensure your meal plan items match our global database.',
      details: err.message 
    });
  }
};
