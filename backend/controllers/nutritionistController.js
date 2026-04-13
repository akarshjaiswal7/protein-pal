const db = require('../db');

// ─── GET ALL PATIENTS WITH TODAY'S STATS ────────────────────────────────────
exports.getPatients = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.UserID, u.Username, u.Email, u.ProteinGoalPerDay,
              COALESCE(SUM((f.ProteinPer100g / 100) * i.QuantityInGrams), 0) AS todayProtein
       FROM user_final u
       LEFT JOIN intake_final i ON u.UserID = i.UserID AND DATE(i.IntakeDate) = CURDATE()
       LEFT JOIN food_final f ON i.FoodID = f.FoodID
       WHERE u.Role = 'User'
       GROUP BY u.UserID`
    );
    res.json(users.map(u => ({ ...u, todayProtein: Math.round(u.todayProtein) })));
  } catch (err) {
    console.error('Nutritionist Fetch Patients Error:', err);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

// ─── SEND NOTE TO USER ───────────────────────────────────────────────────────
exports.createNote = async (req, res) => {
  try {
    const { userId, content } = req.body;
    const nutritionistId = req.user.userId;

    if (!userId || !content || !content.trim()) {
      return res.status(400).json({ error: 'UserID and note content are required' });
    }

    await db.query(
      'INSERT INTO user_notes (NutritionistID, UserID, Content) VALUES (?, ?, ?)',
      [nutritionistId, userId, content.trim()]
    );

    res.status(201).json({ message: 'Note dispatched successfully!' });
  } catch (err) {
    console.error('Create Note Error:', err);
    res.status(500).json({ error: 'Failed to send note' });
  }
};

// ─── GET ALL NOTES SENT BY THIS NUTRITIONIST ────────────────────────────────
exports.getMyNotes = async (req, res) => {
  try {
    const nutritionistId = req.user.userId;
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
    console.error('Get My Notes Error:', err);
    res.status(500).json({ error: 'Failed to fetch notes log' });
  }
};

// ─── GET NOTES FOR A SPECIFIC USER ──────────────────────────────────────────
exports.getNotesForUser = async (req, res) => {
  try {
    const { userId } = req.params;
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
    console.error('Get Notes For User Error:', err);
    res.status(500).json({ error: 'Failed to fetch notes for user' });
  }
};

// ─── DELETE A NOTE ───────────────────────────────────────────────────────────
exports.deleteNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const nutritionistId = req.user.userId;
    // Only allow deleting own notes
    const [result] = await db.query(
      'DELETE FROM user_notes WHERE NoteID = ? AND NutritionistID = ?',
      [noteId, nutritionistId]
    );
    if (result.affectedRows === 0) {
      return res.status(403).json({ error: 'Note not found or not authorized' });
    }
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error('Delete Note Error:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
};
