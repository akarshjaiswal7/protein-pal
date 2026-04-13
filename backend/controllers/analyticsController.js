const db = require('../db');

exports.getDailySummary = async (req, res) => {
  try {
    const userId = req.params.userId;
    // Get date from query string or default to today
    let date = req.query.date;
    if (!date) {
      date = new Date().toISOString().split('T')[0];
    }

    // First fetch user's protein goal
    const [users] = await db.query('SELECT ProteinGoalPerDay FROM user_final WHERE UserID = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const proteinGoal = users[0].ProteinGoalPerDay || 0;

    // Calculate total protein consumed today
    const query = `
      SELECT i.QuantityInGrams, f.ProteinPer100g
      FROM intake_final i
      JOIN food_final f ON i.FoodID = f.FoodID
      WHERE i.UserID = ? AND i.IntakeDate = ?
    `;
    const [intakes] = await db.query(query, [userId, date]);

    let totalProtein = 0;
    intakes.forEach(intake => {
      totalProtein += (intake.ProteinPer100g / 100) * intake.QuantityInGrams;
    });

    const percentage = proteinGoal > 0 ? (totalProtein / proteinGoal) * 100 : 0;
    
    let status = 'Adequate';
    if (proteinGoal <= 0) {
      status = 'No Goal Set';
    } else if (totalProtein === 0) {
      status = 'No Logs Yet';
    } else if (percentage < 90) {
      status = 'Deficient';
    } else if (percentage > 110) {
      status = 'Excess';
    }

    res.json({
      date,
      totalProtein: parseFloat(totalProtein.toFixed(2)),
      proteinGoal,
      percentage: parseFloat(percentage.toFixed(2)),
      status
    });

  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ error: 'Failed to calculate daily summary' });
  }
};

exports.getWeeklySummary = async (req, res) => {
  try {
    const userId = req.params.userId;
    const [users] = await db.query('SELECT ProteinGoalPerDay FROM user_final WHERE UserID = ?', [userId]);
    const proteinGoal = users.length > 0 ? (users[0].ProteinGoalPerDay || 0) : 0;

    const query = `
      SELECT i.IntakeDate, i.QuantityInGrams, f.ProteinPer100g
      FROM intake_final i
      JOIN food_final f ON i.FoodID = f.FoodID
      WHERE i.UserID = ? AND i.IntakeDate >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
    `;
    const [intakes] = await db.query(query, [userId]);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const summary = [];
    
    // Find Monday of the current week
    const now = new Date();
    let dayOfWeek = now.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7; // Convert Sun (0) to 7
    
    const monday = new Date(now);
    // Because dates can jump months, use setDate safely
    monday.setDate(now.getDate() - dayOfWeek + 1);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[i];
      
      let totalProtein = 0;
      intakes.forEach(intake => {
        const dObj = new Date(intake.IntakeDate);
        const y = dObj.getFullYear();
        const m = String(dObj.getMonth() + 1).padStart(2, '0');
        const day = String(dObj.getDate()).padStart(2, '0');
        if (`${y}-${m}-${day}` === dateStr) {
          totalProtein += (intake.ProteinPer100g / 100) * intake.QuantityInGrams;
        }
      });

      summary.push({
        date: dateStr,
        day: dayName,
        protein: Math.round(totalProtein),
        goal: Math.round(proteinGoal)
      });
    }

    res.json(summary);
  } catch(err) {
    console.error('Weekly summary error', err);
    res.status(500).json({ error: 'Failed to fetch weekly summary' });
  }
};
