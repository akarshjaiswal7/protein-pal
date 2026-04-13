const db = require('../db');

exports.addIntake = async (req, res) => {
  try {
    const { userId, foodId, quantityInGrams, intakeDate, intakeTime, mealType } = req.body;

    if (!userId || !foodId || !quantityInGrams || !intakeDate) {
      return res.status(400).json({ error: 'userId, foodId, quantityInGrams, and intakeDate are required' });
    }

    if (quantityInGrams <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    const [result] = await db.query(
      `INSERT INTO intake_final (UserID, FoodID, QuantityInGrams, IntakeDate, IntakeTime, MealType)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, foodId, quantityInGrams, intakeDate, intakeTime || null, mealType || null]
    );

    res.status(201).json({ message: 'Intake logged successfully', intakeId: result.insertId });
  } catch (err) {
    console.error('Add Intake Error:', err);
    res.status(500).json({ error: 'Failed to add intake' });
  }
};

exports.getIntake = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { date } = req.query; // optional filter

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
    console.error('Get Intake Error:', err);
    res.status(500).json({ error: 'Failed to retrieve intake' });
  }
};
