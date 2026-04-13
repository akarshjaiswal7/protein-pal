const db = require('../db');
const logger = require('../utils/logger');

// ─── GET ALL PATIENTS WITH TODAY'S STATS ────────────────────────────────────
exports.getPatients = async (req, res) => {
  logger.info('Nutritionist fetching patient audit list');
  try {
    const [users] = await db.query(
      `SELECT u.UserID, u.Username, u.Email, u.ProteinGoalPerDay,
              COALESCE(SUM((f.ProteinPer100g / 100) * i.QuantityInGrams), 0) AS todayProtein
       FROM user_final u
       LEFT JOIN intake_final i ON u.UserID = i.UserID AND i.IntakeDate = CURDATE()
       LEFT JOIN food_final f ON i.FoodID = f.FoodID
       WHERE u.Role = 'User'
       GROUP BY u.UserID, u.Username, u.Email, u.ProteinGoalPerDay`
    );
    res.json(users.map(u => ({ ...u, todayProtein: Math.round(u.todayProtein) })));
  } catch (err) {
    logger.error('Nutritionist Fetch Patients Error:', err.message);
    res.status(500).json({ error: 'Database error: Failed to retrieve patient clinical stats' });
  }
};

// ─── SEND NOTE TO USER ───────────────────────────────────────────────────────
exports.createNote = async (req, res) => {
  const { userId, content } = req.body;
  const nutritionistId = req.user.userId;
  logger.info(`Nutritionist ${nutritionistId} dispatching note to User ${userId}`);

  try {
    if (!userId || !content || !content.trim()) {
      return res.status(400).json({ error: 'Recipient UserID and note content are required' });
    }

    await db.query(
      'INSERT INTO user_notes (NutritionistID, UserID, Content) VALUES (?, ?, ?)',
      [nutritionistId, userId, content.trim()]
    );

    logger.info(`Professional advice successfully recorded for UserID: ${userId}`);
    res.status(201).json({ message: 'Advice note dispatched and stored in patient history' });
  } catch (err) {
    logger.error(`Create Note Error from ${nutritionistId} to ${userId}:`, err.message);
    res.status(500).json({ error: 'Database error: Failed to record professional advisory' });
  }
};

// ─── GET ALL NOTES SENT BY THIS NUTRITIONIST ────────────────────────────────
exports.getMyNotes = async (req, res) => {
  const nutritionistId = req.user.userId;
  logger.info(`Nutritionist ${nutritionistId} viewing sent notes log`);

  try {
    const [notes] = await db.query(
      `SELECT n.NoteID, n.Content, n.CreatedAt,
              u.UserID, u.Username AS PatientName, u.Email AS PatientEmail
       FROM user_notes n
       JOIN user_final u ON n.UserID = u.UserID
       WHERE n.NutritionistID = ?
       ORDER BY n.CreatedAt DESC`,
      [nutritionistId]
    );
    res.json(notes);
  } catch (err) {
    logger.error(`Get My Notes Error for ${nutritionistId}:`, err.message);
    res.status(500).json({ error: 'Database error: Failed to fetch your advisory log' });
  }
};

// ─── GET NOTES FOR A SPECIFIC USER ──────────────────────────────────────────
exports.getNotesForUser = async (req, res) => {
  const { userId } = req.params;
  logger.info(`System fetching advice history for UserID: ${userId}`);

  try {
    const [notes] = await db.query(
      `SELECT n.NoteID, n.Content, n.CreatedAt,
              u.Username AS NutritionistName
       FROM user_notes n
       JOIN user_final u ON n.NutritionistID = u.UserID
       WHERE n.UserID = ?
       ORDER BY n.CreatedAt DESC`,
      [userId]
    );
    res.json(notes);
  } catch (err) {
    logger.error(`Get Notes For User Error [${userId}]:`, err.message);
    res.status(500).json({ error: 'Database error: Failed to retrieve advisory history for this profile' });
  }
};

// ─── DELETE A NOTE ───────────────────────────────────────────────────────────
exports.deleteNote = async (req, res) => {
  const { noteId } = req.params;
  const nutritionistId = req.user.userId;
  logger.warn(`Nutritionist ${nutritionistId} deleting NoteID: ${noteId}`);

  try {
    const [result] = await db.query(
      'DELETE FROM user_notes WHERE NoteID = ? AND NutritionistID = ?',
      [noteId, nutritionistId]
    );
    if (result.affectedRows === 0) {
      logger.warn(`Note deletion unauthorized or not found: ${noteId} by ${nutritionistId}`);
      return res.status(403).json({ error: 'Note not found or you are not authorized to retract it' });
    }
    res.json({ message: 'Note successfully retracted' });
  } catch (err) {
    logger.error(`Delete Note Error for ${noteId}:`, err.message);
    res.status(500).json({ error: 'Database error: Failed to retract advisory' });
  }
};
