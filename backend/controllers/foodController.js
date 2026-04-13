const db = require('../db');
const logger = require('../utils/logger');

// ─── GET ALL FOODS ───────────────────────────────────────────────────────────
exports.getFoods = async (req, res) => {
  logger.info('Fetching food database');
  try {
    const [foods] = await db.query(`
      SELECT f.*, c.CategoryName, c.SourceType
      FROM food_final f
      LEFT JOIN food_category c ON f.CategoryID = c.CategoryID
      ORDER BY f.FoodName ASC
    `);
    res.json(foods);
  } catch (err) {
    logger.error('Get Foods Error:', err.message);
    res.status(500).json({ error: 'Database error: Failed to retrieve food items' });
  }
};

// ─── ADD FOOD ────────────────────────────────────────────────────────────────
exports.addFood = async (req, res) => {
  const { foodName, proteinPer100g, caloriesPer100g, fatPer100g, carbsPer100g, categoryID } = req.body;
  logger.info(`Nutritionist adding food: ${foodName}`);

  try {
    // Validate required fields
    if (!foodName || foodName.trim() === '') {
      return res.status(400).json({ error: 'Food name is required and cannot be empty' });
    }
    if (proteinPer100g === undefined || proteinPer100g === null || proteinPer100g === '') {
      return res.status(400).json({ error: 'Protein content is required for nutritional tracking' });
    }

    const proteinNum = parseFloat(proteinPer100g);
    if (isNaN(proteinNum) || proteinNum < 0) {
      return res.status(400).json({ error: 'Protein must be a valid non-negative number' });
    }

    const catID = categoryID ? parseInt(categoryID) : null;
    if (categoryID && isNaN(catID)) {
      return res.status(400).json({ error: 'Selected category is invalid' });
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

    logger.info(`Food added successfully: ${foodName} (ID: ${result.insertId})`);
    res.status(201).json({ message: 'Food item successfully added to the global database', foodId: result.insertId });
  } catch (err) {
    logger.error(`Add Food Error for ${foodName}:`, err.message);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'A food with this exact name already exists in the database' });
    }
    res.status(500).json({ error: 'Database error: Failed to add food item' });
  }
};

// ─── DELETE FOOD ─────────────────────────────────────────────────────────────
exports.deleteFood = async (req, res) => {
  const { id } = req.params;
  logger.info(`Moderator attempting to delete food ID: ${id}`);

  try {
    // Reference check
    const [[{ count }]] = await db.query(
      'SELECT COUNT(*) AS count FROM intake_final WHERE FoodID = ?',
      [id]
    );
    
    if (count > 0) {
      logger.warn(`Deletion blocked: Food ID ${id} is referenced in ${count} intake logs`);
      return res.status(400).json({
        error: `Integrity Protection: This food is referenced in ${count} user log(s) and cannot be deleted yet.`
      });
    }

    await db.query('DELETE FROM food_final WHERE FoodID = ?', [id]);
    logger.info(`Food ID ${id} deleted successfully`);
    res.json({ message: 'Food item removed from database' });
  } catch (err) {
    logger.error(`Delete Food Error for ID ${id}:`, err.message);
    res.status(500).json({ error: 'Database error: Failed to remove food item' });
  }
};
