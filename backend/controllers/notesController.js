const db = require('../db');

exports.getUserNotes = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [notes] = await db.query(`
      SELECT n.NoteID, n.Content, n.CreatedAt, u.Username as NutritionistName 
      FROM user_notes n 
      LEFT JOIN user_final u ON n.NutritionistID = u.UserID 
      WHERE n.UserID = ? 
      ORDER BY n.CreatedAt DESC
    `, [userId]);

    res.json(notes);
  } catch(err) {
    console.error('Fetch Notes Error:', err);
    res.status(500).json({ error: 'Failed to fetch personal notes' });
  }
};
