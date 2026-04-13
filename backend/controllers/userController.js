const db = require('../db');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

// ─── GET USER ────────────────────────────────────────────────────────────────
exports.getUser = async (req, res) => {
  const userId = req.params.id;
  logger.info(`Fetching user data for UserID: ${userId}`);
  
  try {
    const [users] = await db.query(
      `SELECT u.UserID, u.Username, u.Email, u.Role, u.Age, u.Weight, u.Gender, u.ActivityID, u.ProteinGoalPerDay,
              a.LevelName AS ActivityLevel, a.ProteinMultiplier
       FROM user_final u
       LEFT JOIN activity_level a ON u.ActivityID = a.ActivityID
       WHERE u.UserID = ?`,
      [userId]
    );

    if (users.length === 0) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found in our system' });
    }

    res.json(users[0]);
  } catch (err) {
    logger.error(`Get User Error for ${userId}:`, err.message);
    res.status(500).json({ error: 'Database error: Could not retrieve user profile' });
  }
};

// ─── UPDATE USER ─────────────────────────────────────────────────────────────
exports.updateUser = async (req, res) => {
  const { userId, age, weight, gender, activityID, proteinGoalPerDay } = req.body;
  logger.info(`Updating profile for UserID: ${userId}`, { age, weight, activityID });

  try {
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required for updates' });
    }

    // Validation: No negative values
    if ((age !== undefined && age < 0) || (weight !== undefined && weight < 0) || (proteinGoalPerDay !== undefined && proteinGoalPerDay < 0)) {
      return res.status(400).json({ error: 'Numerical values (age, weight, goal) cannot be negative' });
    }

    const [result] = await db.query(
      `UPDATE user_final 
       SET Age = COALESCE(?, Age), 
           Weight = COALESCE(?, Weight), 
           Gender = COALESCE(?, Gender), 
           ActivityID = COALESCE(?, ActivityID), 
           ProteinGoalPerDay = COALESCE(?, ProteinGoalPerDay)
       WHERE UserID = ?`,
      [age, weight, gender, activityID, proteinGoalPerDay, userId]
    );

    if (result.affectedRows === 0) {
      logger.warn(`Update failed: User ${userId} not found`);
      return res.status(404).json({ error: 'No user found with the provided ID' });
    }

    logger.info(`Profile updated successfully for UserID: ${userId}`);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    logger.error(`Update User Error for ${userId}:`, err.message);
    res.status(500).json({ error: 'Database error: Failed to sync profile changes' });
  }
};

// ─── DELETE ACCOUNT ──────────────────────────────────────────────────────────
exports.deleteAccount = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  logger.info(`Delete request received for UserID: ${id}`);

  try {
    if (!password) {
      return res.status(400).json({ error: 'Password confirmation is required for account deletion' });
    }

    const [users] = await db.query('SELECT PasswordHash FROM user_final WHERE UserID = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User record not found' });
    }

    const isMatch = await bcrypt.compare(password, users[0].PasswordHash);
    if (!isMatch) {
      logger.warn(`Failed delete attempt for UserID: ${id} - Incorrect Password`);
      return res.status(401).json({ error: 'Invalid password. Deletion aborted.' });
    }

    await db.query('DELETE FROM user_final WHERE UserID = ?', [id]);
    logger.info(`Account permanently deleted for UserID: ${id}`);
    res.json({ message: 'Your account and all associated data have been permanently removed.' });
  } catch (err) {
    logger.error(`Delete User Error for ${id}:`, err.message);
    res.status(500).json({ error: 'Database error: Failed to process account deletion' });
  }
};
