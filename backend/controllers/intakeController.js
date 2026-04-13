const db = require('../db');
const logger = require('../utils/logger');

// ─── ADD INTAKE ─────────────────────────────────────────────────────────────
exports.addIntake = async (req, res) => {
  const { userId, foodId, quantityInGrams, intakeDate, intakeTime, mealType } = req.body;
  logger.info(`User ${userId} logging intake: FoodID ${foodId}, Quantity ${quantityInGrams}g`);

  try {
    if (!userId || !foodId || !quantityInGrams || !intakeDate) {
      return res.status(400).json({ error: 'System error: Missing required fields (userId, foodId, quantity, date)' });
    }

    if (quantityInGrams <= 0) {
      return res.status(400).json({ error: 'Validation error: Quantity must be a positive value' });
    }

    const [result] = await db.query(
      `INSERT INTO intake_final (UserID, FoodID, QuantityInGrams, IntakeDate, IntakeTime, MealType)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, foodId, quantityInGrams, intakeDate, intakeTime || null, mealType || null]
    );

    logger.info(`Intake successfully recorded for UserID ${userId} (ID: ${result.insertId})`);
    res.status(201).json({ message: 'Intake logged successfully', intakeId: result.insertId });
  } catch (err) {
    logger.error(`Add Intake Error for User ${userId}:`, err.message);
    res.status(500).json({ error: 'Database error: Failed to save your nutritional intake' });
  }
};

// ─── GET INTAKE ──────────────────────────────────────────────────────────────
exports.getIntake = async (req, res) => {
  const userId = req.params.userId;
  const { date } = req.query;
  logger.info(`Fetching intake logs for UserID: ${userId}${date ? ` on date ${date}` : ''}`);

  try {
    let query = `
      SELECT i.*, f.FoodName, f.ProteinPer100g, f.CaloriesPer100g 
      FROM intake_final i
      JOIN food_final f ON i.FoodID = f.FoodID
      WHERE i.UserID = ?
    `;
    const params = [userId];

    if (date) {
      query += ` AND i.IntakeDate = ?`;
      params.push(date);
    }

    query += ` ORDER BY i.IntakeDate DESC, i.IntakeTime DESC`;

    const [intakes] = await db.query(query, params);
    res.json(intakes);
  } catch (err) {
    logger.error(`Get Intake Error for User ${userId}:`, err.message);
    res.status(500).json({ error: 'Database error: Failed to retrieve your intake history' });
  }
};
