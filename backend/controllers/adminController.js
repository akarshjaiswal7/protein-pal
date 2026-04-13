const db = require('../db');
const logger = require('../utils/logger');

// ─── GET DASHBOARD STATS ────────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  logger.info('Admin generating dashboard analytics');
  try {
    // Total users (Customers only)
    const [[{ totalUsers }]] = await db.query(
      `SELECT COUNT(*) AS totalUsers FROM user_final WHERE Role = 'User'`
    );

    // Active today: users who logged an intake in the last 24 hours
    // Using a robust date/time window to handle timezone discrepancies
    const [[{ activeToday }]] = await db.query(
      `SELECT COUNT(DISTINCT i.UserID) AS activeToday
       FROM intake_final i
       JOIN user_final u ON i.UserID = u.UserID
       WHERE (i.IntakeDate > DATE_SUB(CURDATE(), INTERVAL 2 DAY) 
              OR (i.IntakeDate = DATE_SUB(CURDATE(), INTERVAL 2 DAY) AND i.IntakeTime >= CURTIME()))
         AND u.Role = 'User'`
    );

    // Average protein consumption (today's calendar day)
    const [[{ avgProtein }]] = await db.query(
      `SELECT COALESCE(AVG(daily_total), 0) AS avgProtein
       FROM (
         SELECT i.UserID, SUM((f.ProteinPer100g / 100) * i.QuantityInGrams) AS daily_total
         FROM intake_final i
         JOIN food_final f ON i.FoodID = f.FoodID
         WHERE i.IntakeDate = CURDATE()
         GROUP BY i.UserID
       ) t`
    );

    // Most used foods (top 5) - Joining for labels
    const [topFoods] = await db.query(
      `SELECT f.FoodName, COUNT(*) AS useCount
       FROM intake_final i
       JOIN food_final f ON i.FoodID = f.FoodID
       GROUP BY f.FoodID, f.FoodName
       ORDER BY useCount DESC
       LIMIT 5`
    );

    // Diet distribution (using final categories)
    const [dietDist] = await db.query(
      `SELECT 
         COALESCE(SUM(CASE WHEN f.CategoryID = 1 THEN 1 ELSE 0 END), 0) AS Vegetarian,
         COALESCE(SUM(CASE WHEN f.CategoryID = 2 THEN 1 ELSE 0 END), 0) AS NonVeg,
         COALESCE(SUM(CASE WHEN f.CategoryID = 3 THEN 1 ELSE 0 END), 0) AS Dairy,
         COALESCE(SUM(CASE WHEN f.CategoryID = 4 THEN 1 ELSE 0 END), 0) AS Supplement
       FROM intake_final i
       JOIN food_final f ON i.FoodID = f.FoodID`
    );

    // Users flagged as low protein (logged today but < 70% of goal)
    const [flaggedLow] = await db.query(
      `SELECT u.UserID, u.Username, u.Email, u.ProteinGoalPerDay,
              COALESCE(SUM((f.ProteinPer100g / 100) * i.QuantityInGrams), 0) AS todayProtein
       FROM user_final u
       LEFT JOIN intake_final i ON u.UserID = i.UserID AND i.IntakeDate = CURDATE()
       LEFT JOIN food_final f ON i.FoodID = f.FoodID
       WHERE u.Role = 'User' AND u.ProteinGoalPerDay IS NOT NULL AND u.ProteinGoalPerDay > 0
       GROUP BY u.UserID, u.Username, u.Email, u.ProteinGoalPerDay
       HAVING todayProtein < u.ProteinGoalPerDay * 0.7`
    );

    // Users exceeding goal (> 130%)
    const [flaggedHigh] = await db.query(
      `SELECT u.UserID, u.Username, u.Email, u.ProteinGoalPerDay,
              COALESCE(SUM((f.ProteinPer100g / 100) * i.QuantityInGrams), 0) AS todayProtein
       FROM user_final u
       LEFT JOIN intake_final i ON u.UserID = i.UserID AND i.IntakeDate = CURDATE()
       LEFT JOIN food_final f ON i.FoodID = f.FoodID
       WHERE u.Role = 'User' AND u.ProteinGoalPerDay IS NOT NULL AND u.ProteinGoalPerDay > 0
       GROUP BY u.UserID, u.Username, u.Email, u.ProteinGoalPerDay
       HAVING todayProtein > u.ProteinGoalPerDay * 1.3`
    );

    res.json({
      totalUsers,
      activeToday,
      avgProtein: Math.round(avgProtein),
      topFoods,
      dietDistribution: dietDist[0] || { Vegetarian: 0, NonVeg: 0, Dairy: 0, Supplement: 0 },
      flaggedLow: flaggedLow.map(u => ({ ...u, todayProtein: Math.round(u.todayProtein) })),
      flaggedHigh: flaggedHigh.map(u => ({ ...u, todayProtein: Math.round(u.todayProtein) })),
    });
  } catch (err) {
    logger.error('Admin Dashboard Analytics Error:', err.message);
    res.status(500).json({ error: 'Database error: Failed to compute dashboard metrics' });
  }
};

// ─── GET ALL USERS ───────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  logger.info('Admin fetching full user list');
  try {
    const [users] = await db.query(
      `SELECT u.UserID, u.Username, u.Email, u.Role, u.ProteinGoalPerDay,
              COALESCE(SUM((f.ProteinPer100g / 100) * i.QuantityInGrams), 0) AS todayProtein
       FROM user_final u
       LEFT JOIN intake_final i ON u.UserID = i.UserID AND i.IntakeDate = CURDATE()
       LEFT JOIN food_final f ON i.FoodID = f.FoodID
       WHERE u.Role = 'User'
       GROUP BY u.UserID, u.Username, u.Email, u.Role, u.ProteinGoalPerDay`
    );
    res.json(users.map(u => ({ ...u, todayProtein: Math.round(u.todayProtein) })));
  } catch (err) {
    logger.error('Admin Fetch Users Error:', err.message);
    res.status(500).json({ error: 'Database error: Failed to retrieve user registry' });
  }
};

// ─── DELETE USER ─────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  logger.warn(`Admin deleting UserID: ${id}`);
  try {
    const [result] = await db.query('DELETE FROM user_final WHERE UserID = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found in system' });
    }
    logger.info(`User ${id} permanently removed by Admin`);
    res.json({ message: 'User and all associated logs permanently removed' });
  } catch (err) {
    logger.error(`Admin Delete User Error for ${id}:`, err.message);
    res.status(500).json({ error: 'Database error: Failed to purge user record' });
  }
};

// ─── FOOD MODERATION ─────────────────────────────────────────────────────────
exports.deleteFood = async (req, res) => {
  // Delegate to foodController or implement directly with logging
  const { id } = req.params;
  logger.warn(`Admin moderate-delete food ID: ${id}`);
  try {
    const [result] = await db.query('DELETE FROM food_final WHERE FoodID = ?', [id]);
    res.json({ message: 'Food item successfully moderated and removed' });
  } catch (err) {
    logger.error(`Admin Food Cleanup Error for ${id}:`, err.message);
    res.status(500).json({ error: 'Database error: Failed to remove food item' });
  }
};
