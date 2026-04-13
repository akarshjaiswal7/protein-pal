const db = require('../db');

// ─── GET DASHBOARD STATS ────────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    // Total users
    const [[{ totalUsers }]] = await db.query(
      `SELECT COUNT(*) AS totalUsers FROM user_final WHERE Role = 'User'`
    );

    // Active today: users who logged an intake in the last 24 hours
    const [[{ activeToday }]] = await db.query(
      `SELECT COUNT(DISTINCT i.UserID) AS activeToday
       FROM intake_final i
       JOIN user_final u ON i.UserID = u.UserID
       WHERE (i.IntakeDate > DATE_SUB(CURDATE(), INTERVAL 1 DAY) 
              OR (i.IntakeDate = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND i.IntakeTime >= CURTIME()))
         AND u.Role = 'User'`
    );

    // Average protein consumption today (across all users who logged)
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

    // Most used foods (top 5)
    const [topFoods] = await db.query(
      `SELECT f.FoodName, COUNT(*) AS useCount
       FROM intake_final i
       JOIN food_final f ON i.FoodID = f.FoodID
       GROUP BY f.FoodID, f.FoodName
       ORDER BY useCount DESC
       LIMIT 5`
    );

    // Diet distribution
    const [dietDist] = await db.query(
      `SELECT 
         SUM(CASE WHEN f.CategoryID = 1 THEN 1 ELSE 0 END) AS Vegetarian,
         SUM(CASE WHEN f.CategoryID = 2 THEN 1 ELSE 0 END) AS NonVeg,
         SUM(CASE WHEN f.CategoryID = 3 THEN 1 ELSE 0 END) AS Dairy,
         SUM(CASE WHEN f.CategoryID = 4 THEN 1 ELSE 0 END) AS Supplement
       FROM intake_final i
       JOIN food_final f ON i.FoodID = f.FoodID`
    );

    // Users flagged as low protein (logged today but < 70% of goal)
    const [flaggedLow] = await db.query(
      `SELECT u.UserID, u.Username, u.Email, u.ProteinGoalPerDay,
              COALESCE(SUM((f.ProteinPer100g / 100) * i.QuantityInGrams), 0) AS todayProtein
       FROM user_final u
       LEFT JOIN intake_final i ON u.UserID = i.UserID AND DATE(i.IntakeDate) = CURDATE()
       LEFT JOIN food_final f ON i.FoodID = f.FoodID
       WHERE u.Role = 'User' AND u.ProteinGoalPerDay IS NOT NULL AND u.ProteinGoalPerDay > 0
       GROUP BY u.UserID
       HAVING todayProtein < u.ProteinGoalPerDay * 0.7`
    );

    // Users exceeding goal
    const [flaggedHigh] = await db.query(
      `SELECT u.UserID, u.Username, u.Email, u.ProteinGoalPerDay,
              COALESCE(SUM((f.ProteinPer100g / 100) * i.QuantityInGrams), 0) AS todayProtein
       FROM user_final u
       LEFT JOIN intake_final i ON u.UserID = i.UserID AND DATE(i.IntakeDate) = CURDATE()
       LEFT JOIN food_final f ON i.FoodID = f.FoodID
       WHERE u.Role = 'User' AND u.ProteinGoalPerDay IS NOT NULL AND u.ProteinGoalPerDay > 0
       GROUP BY u.UserID
       HAVING todayProtein > u.ProteinGoalPerDay * 1.3`
    );

    res.json({
      totalUsers,
      activeToday,
      avgProtein: Math.round(avgProtein),
      topFoods,
      dietDistribution: dietDist[0],
      flaggedLow: flaggedLow.map(u => ({ ...u, todayProtein: Math.round(u.todayProtein) })),
      flaggedHigh: flaggedHigh.map(u => ({ ...u, todayProtein: Math.round(u.todayProtein) })),
    });
  } catch (err) {
    console.error('Admin Dashboard Error:', err);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
};

// ─── GET ALL USERS ───────────────────────────────────────────────────────────
exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.UserID, u.Username, u.Email, u.Role, u.ProteinGoalPerDay,
              COALESCE(SUM((f.ProteinPer100g / 100) * i.QuantityInGrams), 0) AS todayProtein
       FROM user_final u
       LEFT JOIN intake_final i ON u.UserID = i.UserID AND DATE(i.IntakeDate) = CURDATE()
       LEFT JOIN food_final f ON i.FoodID = f.FoodID
       WHERE u.Role = 'User'
       GROUP BY u.UserID`
    );
    res.json(users.map(u => ({ ...u, todayProtein: Math.round(u.todayProtein) })));
  } catch (err) {
    console.error('Failed to get users', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// ─── DELETE USER ─────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM user_final WHERE UserID = ?', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Failed to delete user', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// ─── FOOD MODERATION ─────────────────────────────────────────────────────────
exports.deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM food_final WHERE FoodID = ?', [id]);
    res.json({ message: 'Food deleted successfully' });
  } catch (err) {
    console.error('Delete Food Error:', err);
    res.status(500).json({ error: 'Failed to delete food item' });
  }
};
