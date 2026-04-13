const db = require('../db');

// ─── GET ALL FOODS ───────────────────────────────────────────────────────────
exports.getFoods = async (req, res) => {
  try {
    const [foods] = await db.query('SELECT * FROM food_final ORDER BY FoodName ASC');
    res.json(foods);
  } catch (err) {
    console.error('Get Foods Error:', err);
    res.status(500).json({ error: 'Failed to retrieve foods' });
  }
};

// ─── ADD FOOD ────────────────────────────────────────────────────────────────
exports.addFood = async (req, res) => {
  try {
    const { foodName, proteinPer100g, caloriesPer100g, fatPer100g, carbsPer100g, categoryID } = req.body;

    console.log('Adding Food:', { foodName, proteinPer100g, categoryID });

    // Validate required fields
    if (!foodName || foodName.trim() === '') {
      return res.status(400).json({ error: 'Food name is required' });
    }
    if (proteinPer100g === undefined || proteinPer100g === null || proteinPer100g === '') {
      return res.status(400).json({ error: 'Protein per 100g is required' });
    }

    const proteinNum = parseFloat(proteinPer100g);
    if (isNaN(proteinNum) || proteinNum < 0) {
      return res.status(400).json({ error: 'Protein must be a valid non-negative number' });
    }

    const catID = categoryID ? parseInt(categoryID) : null;
    if (categoryID && isNaN(catID)) {
      return res.status(400).json({ error: 'Invalid category selection' });
    }

    const [result] = await db.query(
      `INSERT INTO food_final (FoodName, ProteinPer100g, CaloriesPer100g, FatPer100g, CarbsPer100g, CategoryID)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        foodName.trim(),
        proteinNum,
        parseFloat(caloriesPer100g) || 0,
        parseFloat(fatPer100g) || 0,
        parseFloat(carbsPer100g) || 0,
        catID,
      ]
    );

    res.status(201).json({ message: 'Food added successfully', foodId: result.insertId });
  } catch (err) {
    console.error('Add Food Error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A food with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to add food: ' + err.message });
  }
};

// ─── DELETE FOOD ─────────────────────────────────────────────────────────────
exports.deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if food is referenced in intakes before deleting
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) AS count FROM intake_final WHERE FoodID = ?',
      [id]
    );
    if (count > 0) {
      return res.status(400).json({
        error: `Cannot delete: this food is referenced in ${count} intake log(s). Remove those logs first.`
      });
    }
    await db.query('DELETE FROM food_final WHERE FoodID = ?', [id]);
    res.json({ message: 'Food deleted successfully' });
  } catch (err) {
    console.error('Delete Food Error:', err);
    res.status(500).json({ error: 'Failed to delete food' });
  }
};
